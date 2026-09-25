'use client';

import Link from 'next/link';
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartFrame } from '@/components/ui/ChartFrame';
import { DataTable } from '@/components/ui/DataTable';
import { KpiTile } from '@/components/ui/KpiTile';
import { demoData, getDistrictById } from '@/data';
import { FUNDING_SOURCE_LABELS } from '@/data/types';
import { explainChart } from '@/lib/definitions';
import { formatDollars, formatMillions } from '@/lib/fiscal';
import { FUNDING_SOURCE_DESCRIPTIONS } from '@/lib/funding';

function pct(part: number, whole: number): string {
  return whole === 0 ? '—' : `${Math.round((part / whole) * 100)}%`;
}

/**
 * State leadership's view of the funding layer: authorized, utilized, and remaining,
 * statewide, by funder, and by district. Built entirely from precomputed totals — no
 * student record is loaded to draw this screen, and none could be seen on it.
 */
export function StateFunding() {
  const funding = demoData.funding;
  const reserve = demoData.stateMetrics.find((s) => s.period === demoData.currentPeriod);
  if (!funding) return null;

  const { totals } = funding;
  const dars = funding.bySource.find((s) => s.source === 'DARS');
  const sources = funding.bySource.filter((s) => s.authorizations > 0);

  const chartData = sources.map((s) => ({
    name: FUNDING_SOURCE_LABELS[s.source],
    utilized: s.dollarsUsed,
    remaining: Math.max(0, s.dollarsAuthorized - s.dollarsUsed),
  }));

  const districtRows = funding.byDistrict.map((d) => ({
    ...d,
    name: getDistrictById(d.darsDistrictId)?.name ?? d.darsDistrictId,
  }));

  return (
    <div className="space-y-8">
      <section aria-label="Statewide funding" data-coach="metric">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiTile
            label="Authorized"
            value={formatMillions(totals.dollarsAuthorized)}
            href="/state/funding/#funders"
            linkLabel="See by funder"
            explainKey="fundingAuthorized"
            note={`${totals.authorizations.toLocaleString()} authorizations across ${sources.length} funders`}
          />
          <KpiTile
            label="Utilized"
            value={formatMillions(totals.dollarsUsed)}
            href="/state/funding/#funders"
            linkLabel="See by funder"
            explainKey="fundingUtilized"
            note={`${pct(totals.dollarsUsed, totals.dollarsAuthorized)} of what was authorized`}
          />
          <KpiTile
            label="Remaining"
            value={formatMillions(totals.dollarsAuthorized - totals.dollarsUsed)}
            href="/state/funding/#by-district"
            linkLabel="See by district"
            explainKey="fundingRemaining"
            note={`${totals.overAuthorized.toLocaleString()} authorizations already over their hours · ${totals.nearLimit.toLocaleString()} near`}
            alert={totals.overAuthorized > 0}
          />
        </div>
      </section>

      {dars && reserve && (
        <p className="rounded-card border border-line bg-surface p-4 text-body text-ink-2" data-coach="tie-out">
          <span className="font-medium text-ink">Checks against the reserve: </span>
          DARS Pre-ETS has used {formatDollars(dars.dollarsUsed)} this fiscal year — the same
          figure as reserve spend to date ({formatDollars(reserve.reserveSpentToDate)}) on the{' '}
          <Link href="/state/reserve/" className="font-medium text-orange-deep underline underline-offset-2">
            15% reserve screen
          </Link>
          . Partner funders pay for the supports around Pre-ETS, so they sit outside the reserve.
        </p>
      )}

      <div data-coach="by-source">
        <ChartFrame
          title={`DARS carries ${pct(dars?.dollarsUsed ?? 0, totals.dollarsUsed)} of what has been spent`}
          tableHeaders={['Funder', 'Utilized', 'Remaining', 'Authorized']}
          tableRows={sources.map((s) => [
            FUNDING_SOURCE_LABELS[s.source],
            formatDollars(s.dollarsUsed),
            formatDollars(s.dollarsAuthorized - s.dollarsUsed),
            formatDollars(s.dollarsAuthorized),
          ])}
          csvFilename="funding-by-source.csv"
          explain={explainChart('fundingUtilized')}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                tick={{ fontSize: 11, fill: 'var(--tb-ink-2)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'var(--tb-surface-sunken)' }}
                contentStyle={{
                  backgroundColor: 'var(--tb-surface)',
                  border: '1px solid var(--tb-border)',
                  borderRadius: '8px',
                }}
                formatter={(value: number, key: string) => [formatDollars(value), key === 'utilized' ? 'Utilized' : 'Remaining']}
              />
              <Legend
                formatter={(value: string) => (value === 'utilized' ? 'Utilized' : 'Remaining')}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="utilized" stackId="a" fill="var(--tb-viz-1)" />
              <Bar dataKey="remaining" stackId="a" fill="var(--tb-viz-neutral)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>

      <section id="funders" className="scroll-mt-4" aria-labelledby="funders-title">
        <h2 id="funders-title" className="text-h2 text-ink">
          Who is paying
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {sources.map((s) => (
            <li key={s.source} className="rounded-card border border-line bg-surface p-4">
              <p className="text-body font-semibold text-ink">{FUNDING_SOURCE_LABELS[s.source]}</p>
              <p className="text-caption text-ink-2">{FUNDING_SOURCE_DESCRIPTIONS[s.source]}</p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-caption">
                <div>
                  <dt className="text-ink-3">Authorized</dt>
                  <dd className="tabular font-medium text-ink">{formatMillions(s.dollarsAuthorized)}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Utilized</dt>
                  <dd className="tabular font-medium text-ink">{formatMillions(s.dollarsUsed)}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Remaining</dt>
                  <dd className="tabular font-medium text-ink">{formatMillions(s.dollarsAuthorized - s.dollarsUsed)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-caption text-ink-2">
                {s.authorizations.toLocaleString()} students · {s.overAuthorized} over · {s.nearLimit} near the limit
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section id="by-district" className="scroll-mt-4" aria-labelledby="by-district-title">
        <h2 id="by-district-title" className="text-h2 text-ink">
          By district
        </h2>
        <div className="mt-4">
          <DataTable
            rows={districtRows}
            rowKey={(r) => r.darsDistrictId}
            csvFilename="funding-by-district.csv"
            caption="Funding by DARS district"
            columns={[
              { key: 'name', header: 'District', sortValue: (r) => r.name, render: (r) => <span className="font-medium">{r.name}</span> },
              { key: 'authorized', header: 'Authorized', numeric: true, sortValue: (r) => r.dollarsAuthorized, render: (r) => formatDollars(r.dollarsAuthorized) },
              { key: 'utilized', header: 'Utilized', numeric: true, sortValue: (r) => r.dollarsUsed, render: (r) => formatDollars(r.dollarsUsed) },
              { key: 'remaining', header: 'Remaining', numeric: true, sortValue: (r) => r.dollarsAuthorized - r.dollarsUsed, render: (r) => formatDollars(r.dollarsAuthorized - r.dollarsUsed) },
              { key: 'share', header: 'Used', numeric: true, sortValue: (r) => (r.dollarsAuthorized ? r.dollarsUsed / r.dollarsAuthorized : 0), render: (r) => pct(r.dollarsUsed, r.dollarsAuthorized) },
              { key: 'near', header: 'Near limit', numeric: true, sortValue: (r) => r.nearLimit, render: (r) => r.nearLimit },
              { key: 'over', header: 'Over', numeric: true, sortValue: (r) => r.overAuthorized, render: (r) => r.overAuthorized },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
