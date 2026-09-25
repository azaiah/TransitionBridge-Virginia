'use client';

import { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';
import { demoData } from '@/data';
import { DataTable } from '@/components/ui/DataTable';
import { ChartFrame } from '@/components/ui/ChartFrame';
import { Button } from '@/components/ui/Button';
import { explainChart } from '@/lib/definitions';
import { reportableRate } from '@/lib/metrics';
import vaGeoJson from '@/data/geo/virginia-localities.geo.json';

type Layer = 'volume' | 'coverage' | 'gap' | 'outcomes';

const LAYERS: { id: Layer; label: string }[] = [
  { id: 'volume', label: 'Referral volume' },
  { id: 'coverage', label: 'Vendor coverage' },
  { id: 'gap', label: 'Service gap' },
  { id: 'outcomes', label: 'Outcomes' },
];

export function CoverageMap() {
  const [activeLayer, setActiveLayer] = useState<Layer>('volume');
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: React.ReactNode } | null>(null);

  // Compute metrics per locality
  const localityMetrics = useMemo(() => {
    return demoData.localities.map((loc) => {
      const divisions = demoData.divisions.filter(d => d.localityFips === loc.fips);
      const divisionIds = new Set(divisions.map(d => d.id));
      
      const referrals = demoData.divisionMetrics
        .filter(m => divisionIds.has(m.divisionId))
        .reduce((sum, m) => sum + m.referralsSubmitted, 0);

      const vendors = demoData.vendors.filter(v => v.servedLocalityFips.includes(loc.fips));
      const capacity = vendors.reduce((sum, v) => sum + v.capacityTotal, 0);

      // Gap: demand - capacity
      const gap = Math.max(0, referrals - capacity);

      // Outcomes: employment rate
      const completed = demoData.divisionMetrics
        .filter(m => divisionIds.has(m.divisionId))
        .reduce((sum, m) => sum + m.referralsCompleted, 0);
      const employed = demoData.divisionMetrics
        .filter(m => divisionIds.has(m.divisionId))
        .reduce((sum, m) => sum + (m.employmentOutcomeRate ? m.employmentOutcomeRate * m.referralsCompleted : 0), 0);
      
      // Null when too few cases completed in this locality to report a rate. Rendered as
      // "Too few cases", never as 0% — see reportableRate in lib/metrics.
      const employmentRate = reportableRate(
        completed > 0 ? employed / completed : null,
        completed,
      );

      return {
        fips: loc.fips,
        name: loc.name,
        divisions: divisions.map(d => d.name).join(', '),
        referrals,
        vendors: vendors.length,
        capacity,
        gap,
        employmentRate,
        completed,
      };
    });
  }, []);

  const getValue = (metric: typeof localityMetrics[0], layer: Layer) => {
    switch (layer) {
      case 'volume': return metric.referrals;
      case 'coverage': return metric.vendors;
      case 'gap': return metric.gap;
      // Localities without enough completed cases shade as "no data" rather than as zero.
      case 'outcomes': return metric.employmentRate ?? -1;
    }
  };

  /** '34%' or the reason there is no rate. Used by the table, CSV, and tooltip alike. */
  const employmentLabel = (metric: typeof localityMetrics[0]) =>
    metric.employmentRate === null
      ? `Too few cases (${metric.completed} completed)`
      : `${Math.round(metric.employmentRate * 100)}%`;

  const values = localityMetrics.map(m => getValue(m, activeLayer));

  // One hue, light to dark, so "more" always reads as darker. Service gaps use the brand
  // orange, because a gap is the thing to act on; every other layer uses the bridge blue.
  const RAMPS: Record<Layer, string[]> = {
    volume: ['#E4EEF4', '#B7D0DF', '#7EA9C3', '#3F7BA1', '#0D4A72'],
    coverage: ['#E4EEF4', '#B7D0DF', '#7EA9C3', '#3F7BA1', '#0D4A72'],
    outcomes: ['#E4EEF4', '#B7D0DF', '#7EA9C3', '#3F7BA1', '#0D4A72'],
    gap: ['#FBEADB', '#F4C29A', '#E8914F', '#CE5500', '#8A3800'],
  };
  const ramp = RAMPS[activeLayer];
  const colorScale = scaleQuantile<string>().domain(values).range(ramp);

  const tableData = [...localityMetrics].sort((a, b) => getValue(b, activeLayer) - getValue(a, activeLayer));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {LAYERS.map(layer => (
          <Button
            key={layer.id}
            variant={activeLayer === layer.id ? 'primary' : 'secondary'}
            onClick={() => setActiveLayer(layer.id)}
            className="!py-1.5 !px-3 text-caption"
          >
            {layer.label}
          </Button>
        ))}
      </div>

      <ChartFrame
        title={`${LAYERS.find(l => l.id === activeLayer)?.label} by locality`}
        explain={explainChart('coverageGap')}
        tableHeaders={['Locality', 'Divisions', 'Referrals', 'Vendors', 'Gap', 'Employment rate']}
        tableRows={tableData.map(r => [
          r.name,
          r.divisions,
          r.referrals,
          r.vendors,
          r.gap,
          employmentLabel(r),
        ])}
        csvFilename={`coverage-map-${activeLayer}.csv`}
      >
        <div className="relative w-full overflow-hidden rounded-lg border border-line bg-canvas">
          <ComposableMap
            // Mercator centred on Virginia. (The composite US projection ignores a centre,
            // which left the state off the canvas and the map blank.)
            projection="geoMercator"
            projectionConfig={{ scale: 5000, center: [-79.45, 38.0] }}
            width={800}
            height={450}
            className="w-full h-auto"
          >
            <Geographies geography={vaGeoJson}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const fips = geo.properties.fips;
                  const metric = localityMetrics.find(m => m.fips === fips);
                  const value = metric ? getValue(metric, activeLayer) : 0;
                  const fill = metric ? colorScale(value) : 'var(--tb-surface-sunken)';

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke="var(--tb-surface)"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: { fill: 'var(--tb-orange-deep)', outline: 'none' },
                        pressed: { outline: 'none' },
                      }}
                      onMouseEnter={(e) => {
                        if (!metric) return;
                        setTooltip({
                          x: e.clientX,
                          y: e.clientY,
                          content: (
                            <div className="rounded-card border border-line bg-surface p-3 shadow-pop text-body">
                              <p className="font-medium text-ink">{metric.name}</p>
                              <p className="text-caption text-ink-2 mt-1">
                                Divisions: {metric.divisions}
                              </p>
                              <p className="text-caption text-ink-2">
                                Referrals: {metric.referrals} · Vendors: {metric.vendors}
                              </p>
                              <p className="text-caption text-ink-2">
                                Gap: {metric.gap} · Employment rate: {employmentLabel(metric)}
                              </p>
                            </div>
                          ),
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>
          
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-control bg-surface/90 px-3 py-1.5 text-caption text-ink-2 shadow-sm">
            <span>{activeLayer === 'outcomes' ? 'Lower' : 'Fewer'}</span>
            <span className="flex" aria-hidden="true">
              {ramp.map((c) => (
                <span key={c} className="h-3 w-6" style={{ backgroundColor: c }} />
              ))}
            </span>
            <span>{activeLayer === 'outcomes' ? 'Higher' : 'More'}</span>
          </div>

          {tooltip && (
            <div
              className="pointer-events-none fixed z-50"
              style={{ left: tooltip.x + 10, top: tooltip.y + 10 }}
            >
              {tooltip.content}
            </div>
          )}
        </div>
      </ChartFrame>

      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Locality',
            render: (r) => <span className="font-medium text-ink">{r.name}</span>,
            sortValue: (r) => r.name,
          },
          {
            key: 'divisions',
            header: 'Divisions',
            render: (r) => r.divisions,
            sortValue: (r) => r.divisions,
          },
          {
            key: 'referrals',
            header: 'Referrals',
            render: (r) => r.referrals,
            sortValue: (r) => r.referrals,
            numeric: true,
          },
          {
            key: 'vendors',
            header: 'Vendors',
            render: (r) => r.vendors,
            sortValue: (r) => r.vendors,
            numeric: true,
          },
          {
            key: 'gap',
            header: 'Gap',
            render: (r) => r.gap,
            sortValue: (r) => r.gap,
            numeric: true,
          },
          {
            key: 'employmentRate',
            header: 'Employment rate',
            render: (r) =>
              r.employmentRate === null ? (
                <span className="text-ink-3">Too few cases</span>
              ) : (
                `${Math.round(r.employmentRate * 100)}%`
              ),
            sortValue: (r) => r.employmentRate ?? -1,
            numeric: true,
          },
        ]}
        rows={tableData}
        rowKey={(r) => r.fips}
        csvFilename="coverage-map-data.csv"
        caption="Localities on the coverage map"
      />
    </div>
  );
}
