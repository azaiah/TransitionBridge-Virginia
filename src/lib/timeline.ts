/**
 * Referral event timelines are DERIVED from the referral's timestamps, not stored.
 *
 * Storing ~69,000 event objects would add roughly 18 MB to the shipped payload for
 * information the record already contains. This module is the single place that turns a
 * `StoredReferral` back into a full `Referral`, so the timeline a counselor reads and the
 * timeline the validation suite checks are always the same one.
 */
import type { Referral, ReferralEvent, Role, StoredReferral, Student } from '@/data/types';
import { MS_PER_DAY } from './demo-clock';

const DECLINE_LABEL: Record<string, string> = {
  NO_CAPACITY: 'no available capacity',
  OUTSIDE_SERVICE_AREA: 'outside the approved service area',
  TRANSPORTATION_NOT_FEASIBLE: 'transportation not feasible',
  CANNOT_DELIVER_ACTIVITY: 'cannot deliver a requested activity',
  SCHEDULING_CONFLICT: 'a scheduling conflict',
  OTHER: 'another reason',
};

/**
 * Hours between the offer going out and the vendor responding. Derived from the referral
 * id so it is stable across builds and identical everywhere it is used — including the
 * `medianResponseHours` on the vendor scorecard.
 */
export function offerLeadHours(referralId: string): number {
  let h = 2166136261;
  for (let i = 0; i < referralId.length; i++) {
    h = Math.imul(h ^ referralId.charCodeAt(i), 16777619) >>> 0;
  }
  // 3–96 hours, skewed low: most providers answer inside two working days.
  const unit = (h % 1000) / 1000;
  return Math.round(3 + unit ** 2 * 93);
}

function shift(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * MS_PER_DAY).toISOString();
}

/** Provider ids and their coordinator persona ids mirror each other by construction. */
export function vendorPersonaId(vendorId: string): string {
  return `DEMO-PER-VND-${vendorId.slice(-4)}`;
}

/** Builds the ordered event timeline for one referral. */
export function buildTimeline(referral: StoredReferral, student?: Student): ReferralEvent[] {
  const events: ReferralEvent[] = [];
  let seq = 0;

  // Who acts at each stage: the school submits, DARS reviews and places, the provider
  // accepts and delivers. Every event names a real persona.
  const school = referral.submittedByPersonaId;
  const counselor = referral.reviewedByPersonaId ?? referral.submittedByPersonaId;
  const provider = referral.assignedVendorId
    ? vendorPersonaId(referral.assignedVendorId)
    : counselor;

  const add = (
    type: ReferralEvent['type'],
    at: string,
    actor: { role: Role; personaId: string },
    note: string | null = null,
  ) => {
    seq++;
    events.push({
      id: `${referral.id}-E${String(seq).padStart(2, '0')}`,
      referralId: referral.id,
      at,
      actorRole: actor.role,
      actorPersonaId: actor.personaId,
      type,
      note,
    });
  };

  const bySchool = { role: 'school_coordinator' as Role, personaId: school };
  const byCounselor = { role: 'dars_counselor' as Role, personaId: counselor };
  const byProvider = { role: 'vendor' as Role, personaId: provider };

  add('SUBMITTED', referral.submittedAt, bySchool, 'Referral submitted.');

  if (referral.reviewedAt) {
    add('REVIEW_STARTED', referral.reviewedAt, byCounselor, 'Review started.');

    // Consent is only part of the story where the student's consent postdates review.
    const consentDate = student?.consentDate ?? null;
    const consentStep =
      consentDate !== null && Date.parse(consentDate) > Date.parse(referral.reviewedAt)
        ? consentDate
        : null;

    if (consentStep !== null) {
      add('CONSENT_REQUESTED', referral.reviewedAt, byCounselor, 'Consent requested from the family.');
      if (referral.status !== 'AWAITING_CONSENT') {
        add('CONSENT_RECEIVED', consentStep, bySchool, 'Signed consent received.');
      }
    }

    const readyAt = consentStep ?? referral.reviewedAt;
    const reachedReady = referral.status !== 'AWAITING_CONSENT' && referral.status !== 'UNDER_REVIEW';
    if (reachedReady) {
      add('MARKED_READY', readyAt, byCounselor, 'Marked ready to assign.');
    }
  }

  if (referral.assignedAt && referral.assignedVendorId) {
    const leadDays = offerLeadHours(referral.id) / 24;
    const offeredAt = shift(referral.assignedAt, -leadDays);

    // A decline is the DECLINING provider's action, so it is attributed to them.
    const decliner = referral.offeredVendorIds[0];
    if (referral.declineReason && decliner && decliner !== referral.assignedVendorId) {
      add(
        'VENDOR_DECLINED',
        shift(offeredAt, -leadDays),
        { role: 'vendor', personaId: vendorPersonaId(decliner) },
        `Provider declined: ${DECLINE_LABEL[referral.declineReason] ?? 'another reason'}.`,
      );
    }
    add('OFFERED_TO_VENDOR', offeredAt, byCounselor, 'Offered to a provider.');
    add('VENDOR_ACCEPTED', referral.assignedAt, byProvider, 'Provider accepted the referral.');
  }

  if (referral.firstServiceAt) {
    add('SERVICE_LOGGED', referral.firstServiceAt, byProvider, 'First service delivered.');
  }
  if (referral.completedAt) {
    add('COMPLETED', referral.completedAt, byProvider, 'Services completed.');
  }
  if (referral.closedAt) {
    add(
      'CLOSED',
      referral.closedAt,
      byCounselor,
      referral.declineReason
        ? `Closed without service: ${DECLINE_LABEL[referral.declineReason] ?? 'another reason'}.`
        : 'Closed without service.',
    );
  }

  return events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

/** Rehydrates a stored referral into the full domain shape. */
export function withTimeline(referral: StoredReferral, student?: Student): Referral {
  return { ...referral, events: buildTimeline(referral, student) };
}
