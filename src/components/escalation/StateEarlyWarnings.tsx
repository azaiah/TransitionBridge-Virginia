'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/ui/DataTable';
import { demoData, getDistrictById, getDivisionById } from '@/data';
import type { EscalationStageCounts } from '@/data/types';
import {
  ESCALATION_TIERS,
  STALL_STAGES,
  STALL_STAGE_LABELS,
  TIER_LABELS,
  type EscalationTier,
  type StallStage,
} from '@/lib/escalation';
import { EarlyWarningPanel } from './EarlyWarningPanel';

function atTier(counts: EscalationStageCounts, tier: EscalationTier, stage: StallStage | null): number {
  return stage ? counts[stage][tier] : STALL_STAGES.reduce((sum, s) => sum + counts[s][tier], 0);
}

/**
 * The statewide early warning view: every district's past-due referrals by rung, each row
 * opening that district's queue already filtered to the rung — so an escalation that
 * reached the state office is one click from the records behind it.
 */
export function StateEarlyWarnings() {
  const params = useSearchParams();
  const summary = demoData.escalations;
  const stageParam = params.get('stage');
  const stage = STALL_STAGES.includes(stageParam as StallStage) ? (stageParam as StallStage) : null;
  if (!summary) return null;

  const districtRows = summary.byDistrict.map((d) => ({
    id: d.darsDistrictId,
    name: getDistrictById(d.darsDistrictId)?.name ?? d.darsDistrictId,
    t14: atTier(d.counts, 14, stage),
    t30: atTier(d.counts, 30, stage),
    t90: atTier(d.counts, 90, stage),
    dormant: d.dormant,
  }));

  const divisionRows = summary.byDivision
    .map((d) => ({
      id: d.divisionId,
      name: getDivisionById(d.divisionId)?.name ?? d.divisionId,
      t14: atTier(d.counts, 14, stage),
      t30: atTier(d.counts, 30, stage),
      t90: atTier(d.counts, 90, stage),
    }))
    .map((d) => ({ ...d, total: d.t14 + d.t30 + d.t90 }))
    .filter((d) => d.total > 0)
    .sort((a, b) => b.t90 - a.t90 || b.t30 - a.t30 || b.total - a.total);

  const queueLink = (districtId: string, tier: EscalationTier) =>
    `/dars/queue/?district=${districtId}&tier=${tier}${stage ? `&stage=${stage}` : ''}`;

  const tierColumns = ESCALATION_TIERS.map((tier) => ({
    key: `t${tier}`,
    header: TIER_LABELS[tier],
    numeric: true,
    sortValue: (r: (typeof districtRows)[number]) => r[`t${tier}` as 't14' | 't30' | 't90'],
    render: (r: (typeof districtRows)[number]) => {
      const n = r[`t${tier}` as 't14' | 't30' | 't90'];
      return n > 0 ? (
        <Link href={queueLink(r.id, tier)} className="font-medium text-orange-deep underline underline-offset-2">
          {n.toLocaleString()}
          <span className="sr-only"> — open {r.name} queue at {TIER_LABELS[tier]}</span>
        </Link>
      ) : (
        <span className="text-ink-3">0</span>
      );
    },
  }));

  return (
    <div className="space-y-8">
      <EarlyWarningPanel
        title="Statewide"
        counts={summary.state}
        stages={STALL_STAGES}
        dormant={summary.dormant}
        linkFor={(tier, s) => `/state/early-warnings/?tier=${tier}${s ? `&stage=${s}` : ''}`}
      />

      <section aria-labelledby="ew-districts" data-coach="action">
        <h2 id="ew-districts" className="text-h2 text-ink">
          By district{stage ? ` · ${STALL_STAGE_LABELS[stage].toLowerCase()}` : ''}
        </h2>
        <p className="mt-1 text-caption text-ink-2">Select a number to open that district’s queue at that rung.</p>
        <div className="mt-4">
          <DataTable
            rows={districtRows}
            rowKey={(r) => r.id}
            csvFilename="early-warnings-by-district.csv"
            caption="Past-due referrals by district"
            columns={[
              { key: 'name', header: 'District', sortValue: (r) => r.name, render: (r) => <span className="font-medium">{r.name}</span> },
              ...tierColumns,
              { key: 'dormant', header: 'Open over a year', numeric: true, sortValue: (r) => r.dormant, render: (r) => r.dormant },
            ]}
          />
        </div>
      </section>

      <section aria-labelledby="ew-divisions">
        <h2 id="ew-divisions" className="text-h2 text-ink">
          School divisions with past-due referrals
        </h2>
        <div className="mt-4">
          <DataTable
            rows={divisionRows}
            rowKey={(r) => r.id}
            csvFilename="early-warnings-by-division.csv"
            caption="Past-due referrals by school division"
            emptyTitle="No school division has a past-due referral"
            emptyDescription="Every referral in this view is moving on time."
            columns={[
              { key: 'name', header: 'School division', sortValue: (r) => r.name, render: (r) => <span className="font-medium">{r.name}</span> },
              { key: 't14', header: TIER_LABELS[14], numeric: true, sortValue: (r) => r.t14, render: (r) => r.t14 },
              { key: 't30', header: TIER_LABELS[30], numeric: true, sortValue: (r) => r.t30, render: (r) => r.t30 },
              { key: 't90', header: TIER_LABELS[90], numeric: true, sortValue: (r) => r.t90, render: (r) => r.t90 },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
