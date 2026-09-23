/**
 * Build-time only. Downloads public census boundary reference data, filters it to
 * Virginia, and writes a bundled, simplified GeoJSON plus a locality reference table.
 *
 * Run once (or when boundaries change): `npm run geo`
 * The OUTPUT is committed. Nothing here executes at runtime — the application never
 * makes a network call, by design (CLAUDE.md §1.7).
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { geoCentroid, geoArea } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';

const SOURCE = 'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json';
const OUT_DIR = path.resolve(process.cwd(), 'src/data/geo');
const CACHE = path.resolve(process.cwd(), 'node_modules/.cache/counties-10m.json');

type CountyProps = { name: string };

async function loadTopology(): Promise<Topology> {
  if (existsSync(CACHE)) {
    return JSON.parse(readFileSync(CACHE, 'utf8')) as Topology;
  }
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Boundary source responded ${res.status}`);
  const json = (await res.json()) as Topology;
  mkdirSync(path.dirname(CACHE), { recursive: true });
  writeFileSync(CACHE, JSON.stringify(json));
  return json;
}

/**
 * Round coordinates to a fixed precision. At Virginia's scale, 4 decimal places is
 * roughly 11 metres — far finer than a choropleth can express — and it cuts the
 * bundled payload by more than half.
 */
function roundCoords(input: unknown, dp = 4): unknown {
  if (typeof input === 'number') return Number(input.toFixed(dp));
  if (Array.isArray(input)) return input.map((v) => roundCoords(v, dp));
  return input;
}

/**
 * Drop tiny outlying polygon rings (barrier islands, river islets) that add weight
 * without being visible or clickable at map scale.
 */
function pruneSlivers(geom: Polygon | MultiPolygon, minAreaSteradians: number): Polygon | MultiPolygon {
  if (geom.type !== 'MultiPolygon') return geom;
  const kept = geom.coordinates.filter((poly) => {
    const area = geoArea({ type: 'Polygon', coordinates: poly });
    return area >= minAreaSteradians;
  });
  if (kept.length === 0 || kept.length === geom.coordinates.length) return geom;
  return { type: 'MultiPolygon', coordinates: kept };
}

async function main(): Promise<void> {
  const topo = await loadTopology();
  const counties = topo.objects.counties as GeometryCollection<CountyProps>;
  const all = feature(topo, counties) as unknown as FeatureCollection<Polygon | MultiPolygon, CountyProps>;

  const va = all.features.filter((f) => String(f.id).startsWith('51'));

  // Virginia: counties occupy FIPS 51001–51199, independent cities 51510–51840.
  const isCity = (fips: string): boolean => Number(fips.slice(2)) >= 500;

  const features: Feature<Polygon | MultiPolygon, Record<string, unknown>>[] = [];
  const localities: {
    fips: string;
    name: string;
    type: 'COUNTY' | 'CITY';
    centroid: [number, number];
    /** Square-degree proxy used only to scale synthetic population weighting. */
    areaRank: number;
  }[] = [];

  for (const f of va) {
    const fips = String(f.id);
    const city = isCity(fips);
    const bare = f.properties.name;
    const name = city ? `${bare} City` : `${bare} County`;
    const geometry = pruneSlivers(f.geometry, 2e-7);
    const centroid = geoCentroid(f) as [number, number];

    features.push({
      type: 'Feature',
      id: fips,
      properties: { fips, name, type: city ? 'CITY' : 'COUNTY' },
      geometry: roundCoords(geometry) as Polygon | MultiPolygon,
    });

    localities.push({
      fips,
      name,
      type: city ? 'CITY' : 'COUNTY',
      centroid: [Number(centroid[0].toFixed(4)), Number(centroid[1].toFixed(4))],
      areaRank: Number((geoArea(f) * 1e6).toFixed(2)),
    });
  }

  localities.sort((a, b) => a.fips.localeCompare(b.fips));
  features.sort((a, b) => String(a.id).localeCompare(String(b.id)));

  mkdirSync(OUT_DIR, { recursive: true });

  const geo: FeatureCollection<Polygon | MultiPolygon, Record<string, unknown>> = {
    type: 'FeatureCollection',
    features,
  };
  writeFileSync(path.join(OUT_DIR, 'virginia-localities.geo.json'), JSON.stringify(geo));
  writeFileSync(
    path.join(OUT_DIR, 'locality-reference.json'),
    JSON.stringify(localities, null, 2),
  );

  const bytes = JSON.stringify(geo).length;
  const cities = localities.filter((l) => l.type === 'CITY').length;
  console.log(`Virginia localities: ${localities.length} (${localities.length - cities} counties, ${cities} independent cities)`);
  console.log(`Bundled boundary payload: ${(bytes / 1024).toFixed(0)} KB`);
  console.log(`Wrote ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
