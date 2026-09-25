'use client';

import { useState } from 'react';
import { useRoleOptional } from '@/context/RoleContext';
import { getPersonaById, demoData } from '@/data';
import { referrals, students } from '@/data/records';
import { Button } from '@/components/ui/Button';
import { ACTIVITY_LABELS, DECLINE_REASONS } from '@/data/types';
import type { DeclineReason } from '@/data/types';
import { CheckCircle2, XCircle, HelpCircle, AlertTriangle, Lock } from 'lucide-react';
import { transitionIdFor } from '@/data/identity';

export function VendorInbox() {
  const roleCtx = useRoleOptional();
  const personaId = roleCtx?.personaId;
  const persona = personaId ? getPersonaById(personaId) : null;
  
  const vendorId = persona?.scopeId ?? demoData.vendors[0].id;
  const vendor = demoData.vendors.find(v => v.id === vendorId);

  // Open offers: READY_TO_ASSIGN in their localities
  const openOffers = referrals.filter(r => 
    r.status === 'READY_TO_ASSIGN' && 
    vendor?.servedLocalityFips.includes(r.localityFips)
  );

  const [handledIds, setHandledIds] = useState<Set<string>>(new Set());
  const [declineReason, setDeclineReason] = useState<DeclineReason | null>(null);
  const [activeDeclineId, setActiveDeclineId] = useState<string | null>(null);

  if (!vendor) return null;

  const handleAccept = (id: string) => {
    setHandledIds(prev => new Set(prev).add(id));
  };

  const handleDecline = (id: string) => {
    if (!declineReason) return;
    setHandledIds(prev => new Set(prev).add(id));
    setActiveDeclineId(null);
    setDeclineReason(null);
  };

  const visibleOffers = openOffers.filter(r => !handledIds.has(r.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h1 text-ink">Referral inbox</h1>
        <p className="mt-2 text-body text-ink-2">
          Review and respond to incoming referral offers.
        </p>
      </div>

      {visibleOffers.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-ok" />
          <h2 className="mt-4 text-h2 text-ink">Inbox zero</h2>
          <p className="mt-2 text-body text-ink-2">You have no pending referral offers to review.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleOffers.map(offer => {
            const student = students.find(s => s.id === offer.studentId);
            const isDeclining = activeDeclineId === offer.id;

            return (
              <div key={offer.id} className="rounded-card border border-line bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-mono text-h3 text-ink">
                        {transitionIdFor({ id: offer.studentId, schoolId: student?.schoolId ?? offer.schoolId })}
                      </h3>
                      <span className="rounded-full bg-info-bg px-2.5 py-0.5 text-caption font-medium text-info">
                        New offer
                      </span>
                    </div>
                    <p className="mt-1 text-body text-ink-2">
                      Age {student?.age} · {student?.planType === 'IEP' ? 'IEP' : 'Section 504'} ·{' '}
                      <span className="inline-flex items-center gap-1 text-caption">
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        Name shared only with the school and DARS
                      </span>
                    </p>
                    
                    <div className="mt-4">
                      <h4 className="text-label font-medium text-ink">Requested activities</h4>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {offer.requestedActivities.map(act => (
                          <li key={act} className="rounded-full bg-surface-sunken px-3 py-1 text-caption text-ink">
                            {ACTIVITY_LABELS[act]}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {offer.transportationBarrier && (
                      <div className="mt-4 flex items-center gap-2 text-caption font-medium text-warn">
                        <AlertTriangle className="h-4 w-4" />
                        Transportation barrier — requires mobile/in-school service
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 sm:w-48">
                    {!isDeclining ? (
                      <>
                        <Button variant="primary" onClick={() => handleAccept(offer.id)}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Accept referral
                        </Button>
                        <Button variant="secondary" onClick={() => setActiveDeclineId(offer.id)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Decline
                        </Button>
                        <Button variant="ghost">
                          <HelpCircle className="mr-2 h-4 w-4" />
                          Request info
                        </Button>
                      </>
                    ) : (
                      <div className="animate-fade-up space-y-3 rounded-lg border border-line bg-surface-sunken p-3">
                        <label className="text-label font-medium text-ink">Reason for declining</label>
                        <select
                          className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
                          value={declineReason ?? ''}
                          onChange={(e) => setDeclineReason(e.target.value as DeclineReason)}
                        >
                          <option value="" disabled>Select a reason...</option>
                          {Object.entries(DECLINE_REASONS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <Button 
                            variant="primary" 
                            className="flex-1 !py-1.5"
                            disabled={!declineReason}
                            onClick={() => handleDecline(offer.id)}
                          >
                            Confirm
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="flex-1 !py-1.5"
                            onClick={() => {
                              setActiveDeclineId(null);
                              setDeclineReason(null);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
