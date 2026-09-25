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
  // The latest moment before a provider could be offered the referral.
  let readyMs = Date.parse(referral.submittedAt);

  if (referral.reviewedAt) {
    add('REVIEW_STARTED', referral.reviewedAt, byCounselor, 'Review started.');

    // Consent belongs to this referral only if it arrived after review and before the
    // referral moved on (offered to a provider) or ended. The student's consent date is
    // shared across their referrals, so a date outside that window belongs to another one.
    const offeredMs =
      referral.assignedAt && referral.assignedVendorId
        ? Date.parse(referral.assignedAt) - (offerLeadHours(referral.id) / 24) * MS_PER_DAY
        : null;
    const endMs = referral.closedAt ? Date.parse(referral.closedAt) : referral.completedAt ? Date.parse(referral.completedAt) : null;
    const upperMs = offeredMs ?? endMs ?? Number.POSITIVE_INFINITY;
    const reviewedMs = Date.parse(referral.reviewedAt);
    const consentDate = student?.consentDate ?? null;
    const consentMs = consentDate === null ? null : Date.parse(consentDate);
    const consentInWindow = consentMs !== null && consentMs > reviewedMs && consentMs < upperMs;
    // Closed before the family's form came back: asked for, never received.
    const closedWaitingOnConsent =
      !consentInWindow && consentMs !== null && consentMs >= upperMs && offeredMs === null && referral.closedAt !== null;

    if (referral.status === 'AWAITING_CONSENT') {
      add('CONSENT_REQUESTED', referral.reviewedAt, byCounselor, 'Consent requested from the family.');
    } else if (consentInWindow && consentDate !== null) {
      add('CONSENT_REQUESTED', referral.reviewedAt, byCounselor, 'Consent requested from the family.');
      add('CONSENT_RECEIVED', consentDate, bySchool, 'Signed consent received.');
    } else if (closedWaitingOnConsent) {
      add('CONSENT_REQUESTED', referral.reviewedAt, byCounselor, 'Consent requested from the family.');
    }

    const readyAt = consentInWindow && consentDate !== null ? consentDate : referral.reviewedAt;
    const reachedReady =
      referral.status !== 'AWAITING_CONSENT' && referral.status !== 'UNDER_REVIEW' && !closedWaitingOnConsent;
    if (reachedReady) {
      add('MARKED_READY', readyAt, byCounselor, 'Marked ready to assign.');
    }
    readyMs = Date.parse(readyAt);
  }

  if (referral.assignedAt && referral.assignedVendorId) {
    const leadDays = offerLeadHours(referral.id) / 24;
    const assignedMs = Date.parse(referral.assignedAt);
    // Never offered before it was ready, and never accepted before it was offered.
    const offeredMs = Math.min(assignedMs, Math.max(assignedMs - leadDays * MS_PER_DAY, readyMs));
    const offeredAt = new Date(offeredMs).toISOString();

    // A decline is the DECLINING provider's action, so it is attributed to them. It sits
    // between being ready and the offer that was accepted.
    const decliner = referral.offeredVendorIds[0];
    if (referral.declineReason && decliner && decliner !== referral.assignedVendorId) {
      add(
        'VENDOR_DECLINED',
        new Date(Math.max(readyMs, offeredMs - leadDays * MS_PER_DAY, (readyMs + offeredMs) / 2)).toISOString(),
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
