import type { Metadata } from 'next';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { Button } from '@/components/ui/Button';
import {
  ReserveBreakdown,
  type NamedSpend,
  type ProjectionPoint,
} from '@/components/state/ReserveBreakdown';
import { ReserveSummary } from '@/components/state/ReserveSummary';
import { CURRENT_PERIOD, demoData, getCurrentStateMetrics } from '@/data';
import { ACTIVITY_LABELS, PRE_ETS_ACTIVITIES } from '@/data/types';
import { FEDERAL_FY_LABEL, federalFyElapsedShare, periodsInCurrentFederalFy } from '@/lib/fiscal';

export const metadata: Metadata = {
  title: 'Pre-ETS reserve',
};

/**
 * The 15% Pre-ETS reserve: what is required, what has been spent, and where the year lands
 * if nothing changes. Spend is filtered to the federal fiscal year, October through September.
 */
export default function StateReservePage() {
  const state = getCurrentStateMetrics();
  const fyPeriods = periodsInCurrentFederalFy(demoData.periods);
  const fyRows = demoData.reserveRows.filter((row) => fyPeriods.includes(row.period));

  const byDistrict: NamedSpend[] = demoData.districts.map((district) => ({
    name: district.name,
    spend: fyRows
      .filter((row) => row.darsDistrictId === district.id)
      .reduce((total, row) => total + row.spend, 0),
  }));

  const byActivity: NamedSpend[] = PRE_ETS_ACTIVITIES.map((activity) => ({
    name: ACTIVITY_LABELS[activity],
    spend: fyRows.reduce((total, row) => total + row.spendByActivity[activity], 0),
  }));

  // Cumulative recorded spend per quarter, with the straight line drawn across the whole
  // year so the gap against the requirement is visible before the year is over.
  const currentIndex = fyPeriods.indexOf(CURRENT_PERIOD);
  let running = 0;
  const projection: ProjectionPoint[] = fyPeriods.map((period, index) => {
    const quarterSpend = fyRows
      .filter((row) => row.period === period)
      .reduce((total, row) => total + row.spend, 0);
    running += quarterSpend;
    const reached = currentIndex === -1 || index <= currentIndex;
    return {
      period,
      actual: reached ? Math.round(running) : null,
      projected: Math.round((state.reserveProjectedYearEnd * (index + 1)) / fyPeriods.length),
    };
  });

  return (
    <ProductLayout>
      <h1 className="text-h1 text-ink">15% Pre-ETS reserve</h1>
      <p className="mt-2 max-w-2xl text-body text-ink-2">
        Federal law requires at least 15% of the vocational rehabilitation award to be reserved
        for pre-employment transition services. This page tracks the {FEDERAL_FY_LABEL}, which
        runs October 1 through September 30.
      </p>

      <div className="mt-8">
        <ReserveSummary
          award={state.federalAwardIllustrative}
          requirement={state.reserveRequirement}
          spentToDate={state.reserveSpentToDate}
          projectedYearEnd={state.reserveProjectedYearEnd}
          elapsedShare={federalFyElapsedShare()}
        />
      </div>

      <section className="mt-12" aria-labelledby="reserve-detail">
        <h2 id="reserve-detail" className="text-h2 text-ink">
          Where the reserve is going
        </h2>
        <p className="mt-1 max-w-2xl text-caption text-ink-2">
          Underspending is rarely uniform. District and activity views show which part of the
          state, and which of the five required activities, is carrying the gap.
        </p>
        <div className="mt-4">
          <ReserveBreakdown
            byDistrict={byDistrict}
            byActivity={byActivity}
            projection={projection}
            requirement={state.reserveRequirement}
          />
        </div>
      </section>

      <aside className="mt-12 rounded-card border border-line bg-surface p-[var(--tb-card-pad)] shadow-sm">
        <h2 className="text-h3 text-ink">About the 15% reserve</h2>
        <p className="mt-2 max-w-2xl text-body text-ink-2">
          The reservation is a floor, not a ceiling or a target. Funds reserved for Pre-ETS and
          not spent on Pre-ETS do not convert into other services, so the practical risk for a
          state agency is underspending rather than overspending. The award figure used here is
          illustrative and is not a published Virginia amount.
        </p>
        <p className="mt-3 text-caption text-ink-2">
          <a
            href="/sources/#cite-A3-reserve"
            className="text-orange-deep underline underline-offset-2 hover:no-underline"
          >
            Source: NTACT:C — Strategies for Managing the 15% Reservation of Funds
          </a>
        </p>
      </aside>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button variant="primary" href="/state/exports/">
          Export the service records behind this
        </Button>
        <Button variant="secondary" href="/state/">
          Back to statewide view
        </Button>
      </div>
    </ProductLayout>
  );
}
