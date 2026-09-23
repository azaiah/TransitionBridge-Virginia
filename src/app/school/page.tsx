'use client';

import { ProductLayout } from '@/components/layout/ProductLayout';
import { useRoleOptional } from '@/context/RoleContext';
import {
  getPersonaById,
  getDivisionById,
  getDefaultPersonaFor,
  getCoordinatorHome,
  demoData,
} from '@/data';
import { KpiTile } from '@/components/ui/KpiTile';
import { Button } from '@/components/ui/Button';
import { AlertRow } from '@/components/ui/AlertRow';
import { PlusCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function SchoolPage() {
  const roleCtx = useRoleOptional();
  // Direct navigation without choosing a view falls back to the first coordinator.
  const persona =
    (roleCtx?.personaId ? getPersonaById(roleCtx.personaId) : null) ??
    getDefaultPersonaFor('school_coordinator');

  const divisionId = persona?.scopeId ?? demoData.divisions[0].id;
  const division = getDivisionById(divisionId);

  // Counts and both work lists are precomputed at build time, so this screen loads no
  // referral or student records at all.
  const home = persona ? getCoordinatorHome(persona.id) : undefined;
  const activeReferrals = home?.activeReferrals ?? 0;
  const awaitingConsent = home?.awaitingConsent ?? 0;
  const stuckReferrals = home?.stuckOver14Days ?? 0;
  const consentAlerts = home?.consentAlerts ?? [];
  const eligibleNotReferred = home?.eligibleNotReferred ?? [];
  const eligibleTotal = home?.eligibleNotReferredCount ?? 0;

  return (
    <ProductLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 text-ink">Division dashboard</h1>
          <p className="mt-2 text-body text-ink-2">
            {division?.name} — {persona?.displayName ?? 'Coordinator view'}
          </p>
        </div>
        <Button variant="primary" href="/school/refer/" data-coach="action">
          <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
          Submit a referral
        </Button>
      </div>

      <section className="mt-8" data-coach="metric">
        <h2 className="text-h2 text-ink">My active referrals</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiTile
            label="Total active"
            value={activeReferrals}
            href="/school/referrals/"
            explainKey="activeReferrals"
          />
          <KpiTile
            label="Awaiting consent"
            value={awaitingConsent}
            href="/school/referrals/?status=AWAITING_CONSENT"
            alert={awaitingConsent > 0}
            explainKey="consentStatus"
          />
          <KpiTile
            label="Waiting more than 14 days"
            value={stuckReferrals}
            href="/school/referrals/?stuck=true"
            alert={stuckReferrals > 0}
            explainKey="unassignedOver14Days"
          />
        </div>
      </section>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 text-ink">Action required</h2>
            <Link href="/school/compliance/" className="text-label font-medium text-orange-deep hover:underline">
              View compliance
            </Link>
          </div>
          
          <div className="flex flex-col gap-3">
            {consentAlerts.length > 0 ? (
              consentAlerts.map(alert => {
                return (
                  <AlertRow
                    key={alert.referralId}
                    message={`Consent form outstanding for ${alert.studentName}`}
                    severity="WARN"
                    ageLabel="Needs action"
                    ownerLabel="Coordinator"
                    // Lands on the referrals list already filtered to consent, where the
                    // row expands in place. There is no per-referral page for schools.
                    linkTo="/school/referrals/?status=AWAITING_CONSENT"
                    linkLabel="Track this referral"
                  />
                );
              })
            ) : (
              <div className="rounded-card border border-line bg-surface p-6 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-ok" />
                <p className="mt-2 text-body font-medium text-ink">All caught up</p>
                <p className="text-caption text-ink-2">No consent forms are currently outstanding.</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 text-ink">Eligible, not referred</h2>
            <span className="rounded-full bg-info-bg px-2.5 py-0.5 text-caption font-medium text-info">
              {eligibleTotal} students
            </span>
          </div>
          <p className="mb-4 text-caption text-ink-2">
            Age 14 or older, on an IEP or a 504 plan, with no referral on file.
          </p>
          
          <div className="rounded-card border border-line bg-surface shadow-sm overflow-hidden">
            {/* An empty list here is good news. Say so, rather than showing a blank card. */}
            {eligibleNotReferred.length === 0 && (
              <div className="p-6 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-ok" aria-hidden="true" />
                <p className="mt-2 text-body font-medium text-ink">Everyone eligible has been referred</p>
                <p className="text-caption text-ink-2">
                  No student aged 14 or older on an IEP or 504 plan is missing a referral.
                </p>
              </div>
            )}
            <ul className="divide-y divide-line">
              {eligibleNotReferred.map(student => (
                <li key={student.studentId} className="flex items-center justify-between p-4 hover:bg-surface-sunken">
                  <div>
                    <p className="text-label font-medium text-ink">{student.displayName}</p>
                    <p className="text-caption text-ink-2">
                      Age {student.age} · {student.planType === 'IEP' ? 'IEP' : 'Section 504'}
                    </p>
                  </div>
                  <Button variant="secondary" className="!py-1.5 !px-3 text-caption" href={`/school/refer/?studentId=${student.studentId}`}>
                    Start referral
                  </Button>
                </li>
              ))}
            </ul>
            {eligibleTotal > eligibleNotReferred.length && (
              <div className="bg-surface-sunken p-3 text-center">
                <Link href="/school/compliance/" className="text-caption font-medium text-orange-deep hover:underline">
                  View all {eligibleTotal} eligible students
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </ProductLayout>
  );
}
