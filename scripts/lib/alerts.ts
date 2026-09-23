/**
 * Alerts are produced by RULES evaluated against the real records — never authored.
 *
 * That matters for one reason: every alert is clickable, and the screen it lands on
 * really does contain records in that state. An alert that leads nowhere is worse than
 * no alert at all (docs/05_DEMO_DATA.md §4).
 */
import type {
  Alert,
  CoverageCell,
  DivisionMetrics,
  Persona,
  SchoolDivision,
  StateMetrics,
  StateHeadline,
  Vendor,
} from '../../src/data/types';
import { CURRENT_PERIOD, REFERENCE_DATE, addDays, isoOf } from './calendar';
import { DISTRICT_DEFS } from './reference';

/** Thresholds, all in one place so a reviewer can see what triggers what. */
export const ALERT_RULES = {
  unassignedPerDistrict: 10,
  workBasedLearningShare: 0.15,
  vendorCapacity: 0.95,
  transportDelayDays: 7,
} as const;

export type AlertInput = {
  divisions: SchoolDivision[];
  divisionMetrics: DivisionMetrics[];
  stateMetrics: StateMetrics[];
  headline: StateHeadline;
  coverage: CoverageCell[];
  vendors: Vendor[];
  personas: Persona[];
  unassignedByDistrict: Map<string, number>;
};

export function buildAlerts(input: AlertInput): Alert[] {
  const alerts: Alert[] = [];
  const state = input.stateMetrics.find((s) => s.period === CURRENT_PERIOD)!;

  const statePersona = input.personas.find((p) => p.role === 'state_leadership')?.id ?? null;
  const districtPersona = (districtId: string) =>
    input.personas.find((p) => p.role === 'dars_counselor' && p.scopeId === districtId)?.id ?? null;
  const vendorPersona = (vendorId: string) =>
    input.personas.find((p) => p.role === 'vendor' && p.scopeId === vendorId)?.id ?? null;

  // Ages are staggered so the queue does not look like it was generated in one instant.
  let ageDays = 1;
  const add = (
    partial: Omit<Alert, 'id' | 'createdAt'> & { createdAt?: string },
  ) => {
    ageDays += 1.5;
    alerts.push({
      id: `DEMO-ALT-${String(alerts.length + 1).padStart(4, '0')}`,
      createdAt: partial.createdAt ?? isoOf(addDays(REFERENCE_DATE, -ageDays)),
      ...partial,
    });
  };

  // Rule: referrals sitting unassigned past 14 days, by district.
  for (const district of DISTRICT_DEFS) {
    const count = input.unassignedByDistrict.get(district.id) ?? 0;
    if (count <= ALERT_RULES.unassignedPerDistrict) continue;
    add({
      severity: 'RISK',
      scope: 'DISTRICT',
      scopeId: district.id,
      message: `${count} referrals in ${district.name} have been waiting more than 14 days without a provider.`,
      ownerPersonaId: districtPersona(district.id),
      linkTo: `/dars/queue/?district=${district.id}&waiting=over14`,
    });
  }

  // Rule: divisions that submitted nothing this quarter.
  if (state.divisionsWithZeroReferrals > 0) {
    add({
      severity: 'WARN',
      scope: 'STATE',
      scopeId: 'STATEWIDE',
      message: `${state.divisionsWithZeroReferrals} school divisions submitted no Pre-ETS referrals in ${CURRENT_PERIOD}.`,
      ownerPersonaId: statePersona,
      linkTo: `/state/divisions/?period=${CURRENT_PERIOD}&zeroReferrals=1`,
    });
  }

  // Rule: localities with no approved provider at all.
  const uncovered = input.coverage.filter((c) => c.vendorCount === 0);
  if (uncovered.length > 0) {
    add({
      severity: 'RISK',
      scope: 'STATE',
      scopeId: 'STATEWIDE',
      message: `${uncovered.length} localities have no approved Pre-ETS provider.`,
      ownerPersonaId: statePersona,
      linkTo: '/state/map/?filter=no-coverage',
    });
  }

  // Rule: work-based learning as a share of services delivered.
  const wblShare = input.headline.activityMix.work_based_learning;
  if (wblShare < ALERT_RULES.workBasedLearningShare) {
    add({
      severity: 'WARN',
      scope: 'STATE',
      scopeId: 'STATEWIDE',
      message: `Work-based learning experiences are ${(wblShare * 100).toFixed(1)}% of Pre-ETS services delivered statewide.`,
      ownerPersonaId: statePersona,
      linkTo: `/state/?metric=activity-mix&period=${CURRENT_PERIOD}`,
    });
  }

  // Rule: providers running at or above 95% of stated capacity.
  const strained = input.vendors
    .filter((v) => v.capacityTotal > 0 && v.capacityUsed / v.capacityTotal > ALERT_RULES.vendorCapacity)
    .sort((a, b) => b.capacityUsed / b.capacityTotal - a.capacityUsed / a.capacityTotal)
    .slice(0, 4);

  for (const vendor of strained) {
    const pct = Math.round((vendor.capacityUsed / vendor.capacityTotal) * 100);
    add({
      severity: 'WARN',
      scope: 'VENDOR',
      scopeId: vendor.id,
      message: `${vendor.name} is carrying ${pct}% of its stated capacity.`,
      ownerPersonaId: vendorPersona(vendor.id),
      linkTo: `/state/vendors/?vendor=${vendor.id}`,
    });
  }

  // Rule: projected Pre-ETS spend against the 15% statutory reserve.
  if (state.reserveProjectedYearEnd < state.reserveRequirement) {
    const shortfall = state.reserveRequirement - state.reserveProjectedYearEnd;
    add({
      severity: 'RISK',
      scope: 'STATE',
      scopeId: 'STATEWIDE',
      message: `Projected Pre-ETS spend is tracking $${(shortfall / 1_000_000).toFixed(1)}M below the 15% reserve requirement.`,
      ownerPersonaId: statePersona,
      linkTo: '/state/reserve/',
    });
  }

  // Rule: the transportation barrier, expressed as days rather than anecdote.
  const { withBarrier, withoutBarrier } = input.headline.transportBarrierDaysToService;
  const delay = withBarrier - withoutBarrier;
  if (delay > ALERT_RULES.transportDelayDays) {
    add({
      severity: 'INFO',
      scope: 'STATE',
      scopeId: 'STATEWIDE',
      message: `Referrals flagged with a transportation barrier take ${Math.round(delay)} days longer to reach a first service.`,
      ownerPersonaId: statePersona,
      linkTo: '/dars/queue/?filter=transportation-barrier',
    });
  }

  return alerts;
}
