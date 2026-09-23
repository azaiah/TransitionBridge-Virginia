'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { VendorMatchPanel } from '@/components/dars/VendorMatchPanel';
import { ReferralTimeline } from '@/components/shared/ReferralTimeline';
import type { Referral } from '@/data/types';
import { PLAN_TYPE_LABELS, ACTIVITY_LABELS, DIPLOMA_TRACK_LABELS } from '@/data/types';
import { getDivisionById, getVendorById } from '@/data';
import { getStudentById } from '@/data/records';
import { formatFullDate } from '@/lib/dates';

export function ReferralDetail({ referral }: { referral: Referral }) {
  const [showAssign, setShowAssign] = useState(false);
  
  const student = getStudentById(referral.studentId);
  const division = getDivisionById(referral.divisionId);
  const vendor = referral.assignedVendorId ? getVendorById(referral.assignedVendorId) : null;

  if (!student || !division) return null;

  const isUnassigned = ['NEW', 'UNDER_REVIEW', 'READY_TO_ASSIGN'].includes(referral.status);
  
  const consentRequested = referral.events.find(e => e.type === 'CONSENT_REQUESTED');
  const consentReceived = referral.events.find(e => e.type === 'CONSENT_RECEIVED');
  
  let consentStatus = 'Not requested yet';
  if (consentReceived) consentStatus = `Received ${formatFullDate(consentReceived.at)}`;
  else if (consentRequested) consentStatus = `Requested ${formatFullDate(consentRequested.at)}`;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <Link href="/dars/queue/" className="inline-flex items-center gap-1 text-label text-ink-3 hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to the referral queue
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {/* Wraps so the status badge moves under the name on narrow phones. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-h1 text-ink">{student.displayName}</h1>
            <StatusPill status={referral.status} />
          </div>
          <p className="mt-1 text-body text-ink-2">
            ID: {student.id} · {division.name}
          </p>
        </div>
        
        {isUnassigned && !showAssign && (
          <Button variant="primary" onClick={() => setShowAssign(true)}>
            Assign to provider
          </Button>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {showAssign && (
            <div className="rounded-card border-2 border-orange bg-surface p-6 shadow-md">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-h2 text-ink">Select provider</h2>
                <Button variant="ghost" onClick={() => setShowAssign(false)}>Cancel</Button>
              </div>
              <VendorMatchPanel referral={referral} />
            </div>
          )}

          <section className="rounded-card border border-line bg-surface p-6">
            <h2 className="text-h2 text-ink">Referral details</h2>
            <dl className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-label text-ink-3">Plan type</dt>
                <dd className="mt-1 text-body font-medium text-ink">{PLAN_TYPE_LABELS[referral.planType]}</dd>
              </div>
              <div>
                <dt className="text-label text-ink-3">Diploma track</dt>
                <dd className="mt-1 text-body font-medium text-ink">{DIPLOMA_TRACK_LABELS[referral.diplomaTrack]}</dd>
              </div>
              <div>
                <dt className="text-label text-ink-3">Grade level</dt>
                <dd className="mt-1 text-body font-medium text-ink">Grade {referral.gradeLevel}</dd>
              </div>
              <div>
                <dt className="text-label text-ink-3">Transportation barrier</dt>
                <dd className="mt-1 text-body font-medium text-ink">
                  {referral.transportationBarrier ? 'Yes — requires mobile/in-school service' : 'No'}
                </dd>
              </div>
              <div>
                <dt className="text-label text-ink-3">Consent status</dt>
                <dd className="mt-1 text-body font-medium text-ink">{consentStatus}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-label text-ink-3">Requested activities</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {referral.requestedActivities.map((act) => (
                    <span key={act} className="rounded-full bg-surface-sunken px-3 py-1 text-caption text-ink">
                      {ACTIVITY_LABELS[act]}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </section>

          {vendor && (
            <section className="rounded-card border border-line bg-surface p-6">
              <h2 className="text-h2 text-ink">Assigned provider</h2>
              <div className="mt-4 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink-2">
                  <Building className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-h3 text-ink">{vendor.name}</h3>
                  <p className="text-body text-ink-2">
                    {referral.assignedAt
                      ? `Assigned ${formatFullDate(referral.assignedAt)}`
                      : 'Assignment date not recorded'}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        <div>
          <section className="rounded-card border border-line bg-surface p-6">
            <h2 className="text-h2 text-ink">Event timeline</h2>
            <p className="mt-1 text-caption text-ink-3">
              Everyone who has touched this referral, and when.
            </p>

            <div className="mt-6">
              <ReferralTimeline referralId={referral.id} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
