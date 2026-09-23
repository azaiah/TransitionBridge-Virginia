'use client';

import { KpiTile } from '@/components/ui/KpiTile';
import type { StateHeadline } from '@/data/types';

export function StateKpis({ headline }: { headline: StateHeadline }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiTile
        label="Active referrals"
        value={headline.activeReferrals.toLocaleString()}
        trend={headline.activeReferralsTrend}
        href="/dars/queue/"
        explainKey="activeReferrals"
      />
      <KpiTile
        label="Unassigned > 14 days"
        value={headline.unassignedOver14Days.toLocaleString()}
        trend={headline.unassignedOver14DaysTrend}
        href="/dars/queue/?waiting=over14"
        alert={headline.unassignedOver14Days > 0}
        explainKey="unassignedOver14Days"
      />
      <KpiTile
        label="Median days: referral → service start"
        value={headline.medianDaysToFirstService}
        unit="days"
        trend={headline.medianDaysToFirstServiceTrend}
        href="/dars/queue/?stage=in-service"
        explainKey="daysToFirstService"
      />
      <KpiTile
        label="Divisions with zero referrals this quarter"
        value={headline.divisionsWithZeroReferrals}
        trend={headline.divisionsWithZeroReferralsTrend}
        href="/state/divisions/?zeroReferrals=1"
        alert={headline.divisionsWithZeroReferrals > 0}
        explainKey="zeroReferralDivisions"
      />
      <KpiTile
        label="Counties without vendor coverage"
        value={headline.localitiesWithoutVendorCoverage}
        trend={headline.localitiesWithoutVendorCoverageTrend}
        href="/state/map/?filter=no-coverage"
        explainKey="localitiesWithoutCoverage"
      />
      <KpiTile
        label="Pre-ETS reserve utilized"
        value={headline.reserveUtilizedPct}
        unit="%"
        trend={headline.reserveUtilizedPctTrend}
        href="/state/reserve/"
        explainKey="reserveSpentToDate"
      />
    </div>
  );
}
