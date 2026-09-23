import type { Metadata } from 'next';
import { ProductLayout } from '@/components/layout/ProductLayout';
import { Button } from '@/components/ui/Button';
import { WioaBreakdown, type BreakdownRow } from '@/components/state/WioaBreakdown';
import { WioaIndicatorCards } from '@/components/state/WioaIndicatorCards';
import { CURRENT_PERIOD, demoData, getDistrictById, getDivisionById } from '@/data';

export const metadata: Metadata = {
  title: 'WIOA outcomes',
};

/**
 * The six WIOA §116 primary indicators, statewide and broken down.
 *
 * Everything on this page is read straight from precomputed aggregates — no records are
 * aggregated here, so the page renders instantly with 132 divisions in the table.
 */
export default function StateOutcomesPage() {
  const history = demoData.stateMetrics;

  const districts: BreakdownRow[] = demoData.districtMetrics
    .filter((row) => row.period === CURRENT_PERIOD)
    .map((row) => ({
      id: row.darsDistrictId,
      name: getDistrictById(row.darsDistrictId)?.name ?? row.darsDistrictId,
      referralsSubmitted: row.referralsSubmitted,
      indicators: row.wioaIndicators,
    }));

  const divisions: BreakdownRow[] = demoData.divisionMetrics
    .filter((row) => row.period === CURRENT_PERIOD)
    .map((row) => {
      const division = getDivisionById(row.divisionId);
      return {
        id: row.divisionId,
        name: division?.name ?? row.divisionId,
        parentName: division ? getDistrictById(division.darsDistrictId)?.name : undefined,
        referralsSubmitted: row.referralsSubmitted,
        indicators: row.wioaIndicators,
      };
    });

  return (
    <ProductLayout>
      <h1 className="text-h1 text-ink">WIOA §116 outcomes</h1>
      <p className="mt-2 max-w-2xl text-body text-ink-2">
        The six primary indicators of performance, in statutory order and under their statutory
        names. Open the <span aria-hidden="true">?</span>
        <span className="sr-only">explain</span> on any indicator for the plain-language
        definition and the federal source.
      </p>

      <section className="mt-8" aria-labelledby="statewide-indicators">
        <h2 id="statewide-indicators" className="text-h2 text-ink">
          Statewide, {CURRENT_PERIOD}
        </h2>
        <p className="mt-1 max-w-2xl text-caption text-ink-2">
          Each figure covers a trailing four quarters, so a light quarter does not swing the
          line. This demonstration dataset has no exit quarters — every indicator names the
          proxy it uses inside its explanation.
        </p>
        <div className="mt-4">
          <WioaIndicatorCards history={history} />
        </div>
      </section>

      <section className="mt-12" aria-labelledby="outcome-breakdown">
        <h2 id="outcome-breakdown" className="text-h2 text-ink">
          Where the statewide number comes from
        </h2>
        <p className="mt-1 max-w-2xl text-caption text-ink-2">
          A statewide average can look healthy while a district or a division sits well below it.
          Pick an indicator to see who is carrying it and who is behind.
        </p>
        <div className="mt-4">
          <WioaBreakdown districts={districts} divisions={divisions} />
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button variant="primary" href="/state/reports/">
          Build a report from these figures
        </Button>
        <Button variant="secondary" href="/state/">
          Back to statewide view
        </Button>
      </div>
    </ProductLayout>
  );
}
