'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { KpiTile } from '@/components/ui/KpiTile';
import { useViewer } from '@/context/useViewer';
import { getDistrictById, getVendorById } from '@/data';
import { getAuthorizationsForDistrict } from '@/data/funding';
import { transitionIdFor } from '@/data/identity';
import { getReferralById } from '@/data/records';
import type { FundingSource } from '@/data/types';
import { FUNDING_SOURCES, FUNDING_SOURCE_LABELS } from '@/data/types';
import { formatDollars } from '@/lib/fiscal';
import {
  AUTHORIZATION_STATUS_LABELS,
  authorizationStatus,
  formatHours,
  hoursRemaining,
  hoursUsed,
  sumAuthorizations,
  type AuthorizationStatus,
} from '@/lib/funding';
import { adjustAuthorization, useAuthorizationAdjustments } from '@/lib/session-store';
import { AuthorizationStatusPill } from './AuthorizationMeter';

const STATUS_FILTERS: (AuthorizationStatus | 'ALL')[] = ['ALL', 'OVER', 'NEAR_LIMIT', 'OK'];

/**
 * Every authorization in the counselor's district: who pays, how many hours were
 * authorized, how many are used, and how many are left. Sorted so the ones that need a
 * decision — over the limit, then near it — come first.
 */
export function CounselorFunding() {
  const { persona } = useViewer();
  const searchParams = useSearchParams();
  const adjustments = useAuthorizationAdjustments();
  const districtId = persona?.scopeId ?? '';
  const district = getDistrictById(districtId);

  const [status, setStatus] = useState<AuthorizationStatus | 'ALL'>(() => {
    const fromUrl = searchParams.get('status');
    return STATUS_FILTERS.includes(fromUrl as AuthorizationStatus) ? (fromUrl as AuthorizationStatus) : 'ALL';
  });
  const [source, setSource] = useState<FundingSource | 'ALL'>('ALL');

  // The tiles on this screen link back to it with a status, so follow the address.
  useEffect(() => {
    const fromUrl = searchParams.get('status');
    setStatus(STATUS_FILTERS.includes(fromUrl as AuthorizationStatus) ? (fromUrl as AuthorizationStatus) : 'ALL');
  }, [searchParams]);

  const all = useMemo(
    () => getAuthorizationsForDistrict(districtId).map((a) => adjustAuthorization(a, adjustments)),
    [districtId, adjustments],
  );
  const totals = useMemo(() => sumAuthorizations(all), [all]);

  const rows = useMemo(() => {
    const order: Record<AuthorizationStatus, number> = { OVER: 0, NEAR_LIMIT: 1, OK: 2 };
    return all
      .filter((a) => status === 'ALL' || authorizationStatus(a) === status)
      .filter((a) => source === 'ALL' || a.source === source)
      .map((a) => {
        const referral = getReferralById(a.referralId);
        return {
          auth: a,
          status: authorizationStatus(a),
          transitionId: referral ? transitionIdFor({ id: a.studentId, schoolId: referral.schoolId }) : a.studentId,
          provider: referral?.assignedVendorId ? (getVendorById(referral.assignedVendorId)?.name ?? '—') : '—',
        };
      })
      .sort((x, y) => order[x.status] - order[y.status] || hoursRemaining(x.auth) - hoursRemaining(y.auth));
  }, [all, status, source]);

  return (
    <div className="space-y-8">
      <section data-coach="metric" aria-label="Funding totals">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <KpiTile
            label="Authorized this year"
            value={formatDollars(totals.dollarsAuthorized)}
            href="/dars/funding/?status=ALL#authorizations"
            linkLabel="See every authorization"
            explainKey="fundingAuthorized"
            note={`${totals.authorizations.toLocaleString()} authorizations · ${formatHours(totals.hoursAuthorized)}`}
          />
          <KpiTile
            label="Utilized"
            value={formatDollars(totals.dollarsUsed)}
            href="/dars/funding/?status=ALL#authorizations"
            linkLabel="See every authorization"
            explainKey="fundingUtilized"
            note={`${formatHours(totals.hoursUsed)} delivered`}
          />
          <KpiTile
            label="Near the limit"
            value={totals.nearLimit}
            href="/dars/funding/?status=NEAR_LIMIT#authorizations"
            linkLabel="Show only these"
            alert={totals.nearLimit > 0}
            explainKey="authorizationNearLimit"
          />
          <KpiTile
            label="Over authorization"
            value={totals.overAuthorized}
            href="/dars/funding/?status=OVER#authorizations"
            linkLabel="Show only these"
            alert={totals.overAuthorized > 0}
            explainKey="authorizationOver"
          />
        </div>
      </section>

      <p className="flex items-start gap-2 rounded-card border border-line bg-surface p-4 text-body text-ink-2" data-coach="guard">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ok" aria-hidden="true" />
        <span>
          <span className="font-medium text-ink">How over-billing is stopped: </span>
          when a provider logs a service, the hours are checked against the authorization first.
          A session that would go past the limit is refused, and the provider is told to ask you
          for an extension. Extending one takes a reason, and it is recorded.
        </span>
      </p>

      <div id="authorizations" className="flex scroll-mt-4 flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-4" data-coach="filters">
        <label htmlFor="funding-status" className="text-label font-medium text-ink">
          Show me
        </label>
        <select
          id="funding-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as AuthorizationStatus | 'ALL')}
          className="rounded-control border border-line bg-surface px-3 py-1.5 text-body"
        >
          <option value="ALL">Every authorization</option>
          <option value="OVER">{AUTHORIZATION_STATUS_LABELS.OVER}</option>
          <option value="NEAR_LIMIT">{AUTHORIZATION_STATUS_LABELS.NEAR_LIMIT}</option>
          <option value="OK">{AUTHORIZATION_STATUS_LABELS.OK}</option>
        </select>
        <label htmlFor="funding-source" className="text-label font-medium text-ink">
          Paid by
        </label>
        <select
          id="funding-source"
          value={source}
          onChange={(e) => setSource(e.target.value as FundingSource | 'ALL')}
          className="rounded-control border border-line bg-surface px-3 py-1.5 text-body"
        >
          <option value="ALL">Any funder</option>
          {FUNDING_SOURCES.map((s) => (
            <option key={s} value={s}>
              {FUNDING_SOURCE_LABELS[s]}
            </option>
          ))}
        </select>
        <p className="text-caption text-ink-2" role="status" aria-live="polite">
          {`${rows.length.toLocaleString()} authorizations${district ? ` · ${district.name}` : ''}`}
        </p>
      </div>

      <DataTable
        rows={rows}
        rowKey={(r) => r.auth.id}
        exportKind="records"
        csvFilename="authorizations.csv"
        caption="Funding authorizations in this district"
        emptyTitle="No authorizations match"
        emptyDescription="Nothing is in that state right now. Show every authorization to see the rest."
        emptyActionLabel="Show every authorization"
        onEmptyAction={() => {
          setStatus('ALL');
          setSource('ALL');
        }}
        rowClassName={(r) =>
          r.status === 'OVER' ? 'border-l-[3px] border-l-risk' : r.status === 'NEAR_LIMIT' ? 'border-l-[3px] border-l-warn' : undefined
        }
        columns={[
          {
            key: 'student',
            header: 'Transition ID',
            sortValue: (r) => r.transitionId,
            render: (r) => (
              <Link
                href={`/dars/students/detail/?id=${r.auth.studentId}#funding`}
                className="font-mono text-caption text-ink-2 hover:text-orange-deep hover:underline"
              >
                {r.transitionId}
              </Link>
            ),
          },
          {
            key: 'source',
            header: 'Paid by',
            sortValue: (r) => FUNDING_SOURCE_LABELS[r.auth.source],
            render: (r) => FUNDING_SOURCE_LABELS[r.auth.source],
          },
          {
            key: 'service',
            header: 'Service',
            defaultVisible: false,
            sortValue: (r) => r.auth.service,
            render: (r) => r.auth.service,
          },
          {
            key: 'authorized',
            header: 'Authorized',
            numeric: true,
            sortValue: (r) => r.auth.hoursAuthorized,
            render: (r) => formatHours(r.auth.hoursAuthorized),
          },
          {
            key: 'used',
            header: 'Used',
            numeric: true,
            sortValue: (r) => Math.round(hoursUsed(r.auth) * 10) / 10,
            render: (r) => formatHours(hoursUsed(r.auth)),
          },
          {
            key: 'remaining',
            header: 'Remaining',
            numeric: true,
            sortValue: (r) => Math.round(hoursRemaining(r.auth) * 10) / 10,
            // One line per row: the table virtualizes long lists at a fixed row height.
            render: (r) => {
              const left = hoursRemaining(r.auth);
              return left < 0 ? (
                <span className="font-medium text-risk">{formatHours(-left)} over</span>
              ) : (
                <span className="tabular">{formatHours(left)}</span>
              );
            },
          },
          {
            key: 'status',
            header: 'Status',
            sortValue: (r) => AUTHORIZATION_STATUS_LABELS[r.status],
            render: (r) => <AuthorizationStatusPill auth={r.auth} />,
          },
          {
            key: 'dollars',
            header: 'Dollars used',
            numeric: true,
            defaultVisible: false,
            sortValue: (r) => r.auth.dollarsUsed,
            render: (r) => `${formatDollars(r.auth.dollarsUsed)} of ${formatDollars(r.auth.dollarsAuthorized)}`,
          },
          {
            key: 'provider',
            header: 'Provider',
            defaultVisible: false,
            sortValue: (r) => r.provider,
            render: (r) => r.provider,
          },
        ]}
      />
    </div>
  );
}
