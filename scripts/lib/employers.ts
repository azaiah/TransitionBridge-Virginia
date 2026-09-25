/**
 * Synthetic employer partners and their job postings — the "employer section" from the
 * IEP Partners feedback round. Every name is invented from neutral word pools and checked
 * against REAL_NAME_BLOCKLIST by the validation suite, exactly like provider names.
 *
 * Employers sit in real Virginia localities so a posting can be matched to students in the
 * same DARS district, and so "reachable without a car" can matter where transportation is
 * the barrier.
 */
import type {
  CareerField,
  Employer,
  EmployerBundle,
  JobPosting,
  JobType,
  Locality,
} from '../../src/data/types';
import { CAREER_FIELDS } from '../../src/data/types';
import { REFERENCE_DATE } from './calendar';
import type { Rng } from './prng';
import { chance, pick, randFloat, randInt, shuffle, subRng, weightedPick } from './prng';

const PREFIX = [
  'Riverbend', 'Stonebridge', 'Fair Meadow', 'Old Mill', 'Copper Kettle', 'Harborview',
  'Cardinal', 'Dogwood', 'Sunny Ridge', 'Twin Oaks', 'Lantern', 'Redbud', 'Foxfield',
  'Millrace', 'Quarry', 'Beacon Hill', 'Willow Run', 'Pinehurst', 'Anchor Point',
  'Greenfield', 'Sandpiper', 'Crescent', 'Trailhead', 'Bluebell', 'Kestrel', 'Laurel Fork',
] as const;

const KIND: Record<CareerField, readonly string[]> = {
  HEALTHCARE: ['Family Clinic', 'Senior Living', 'Care Center', 'Pharmacy', 'Rehab Clinic'],
  INFORMATION_TECHNOLOGY: ['Tech Services', 'Computer Repair', 'Data Services'],
  SKILLED_TRADES: ['Builders', 'Electric', 'Plumbing and Heating', 'Cabinet Shop'],
  HOSPITALITY: ['Hotel Group', 'Cafe', 'Bakery', 'Diner', 'Catering'],
  RETAIL: ['Grocery', 'Hardware', 'Outfitters', 'Garden Center', 'Market'],
  LOGISTICS: ['Distribution', 'Logistics', 'Freight', 'Supply'],
  EDUCATION: ['Early Learning Center', 'Child Development Center', 'After-School Program'],
  AUTOMOTIVE: ['Auto Care', 'Tire and Service', 'Collision Repair'],
  AGRICULTURE: ['Landscaping', 'Farms', 'Nursery', 'Orchard'],
  OFFICE_ADMIN: ['Print Shop', 'Property Management', 'Business Services'],
};

/** Job titles and a plausible hourly range for each field. Illustrative only. */
const TITLES: Record<CareerField, readonly [string, number, number][]> = {
  HEALTHCARE: [
    ['Patient transport aide', 14.5, 17],
    ['Dietary aide', 13.5, 16],
    ['Pharmacy stock assistant', 14, 16.5],
    ['Front desk assistant', 14, 17],
  ],
  INFORMATION_TECHNOLOGY: [
    ['Device setup technician', 16, 19],
    ['Help desk assistant', 15.5, 18.5],
    ['Data entry clerk', 14, 16.5],
  ],
  SKILLED_TRADES: [
    ["Carpenter's helper", 15, 18],
    ['Electrical helper', 15.5, 18.5],
    ['Shop assistant', 14.5, 17],
  ],
  HOSPITALITY: [
    ['Kitchen prep assistant', 13.5, 15.5],
    ['Housekeeping attendant', 13.5, 15.5],
    ['Barista', 13, 15],
  ],
  RETAIL: [
    ['Stock associate', 13.5, 15.5],
    ['Cashier', 13, 15],
    ['Garden center associate', 13.5, 15.5],
  ],
  LOGISTICS: [
    ['Warehouse associate', 15, 18],
    ['Package handler', 15, 17.5],
    ['Inventory assistant', 14.5, 17],
  ],
  EDUCATION: [
    ['Classroom aide', 13.5, 16],
    ['After-school program assistant', 13, 15.5],
  ],
  AUTOMOTIVE: [
    ['Lube and tire technician trainee', 14.5, 17],
    ['Detailer', 13.5, 15.5],
  ],
  AGRICULTURE: [
    ['Landscaping crew member', 14, 16.5],
    ['Greenhouse assistant', 13.5, 15.5],
  ],
  OFFICE_ADMIN: [
    ['Office assistant', 14, 16.5],
    ['Mailroom clerk', 13.5, 15.5],
    ['Print production assistant', 14, 16],
  ],
};

const ACCOMMODATIONS = [
  'Flexible schedule',
  'Job coach welcome on site',
  'Written and picture-based instructions',
  'Quiet break area',
  'Accessible entrance and restrooms',
  'Noise-reducing headphones allowed',
  'Extra training time',
] as const;

const FIELD_WEIGHTS: readonly (readonly [CareerField, number])[] = [
  ['HEALTHCARE', 0.16],
  ['RETAIL', 0.15],
  ['HOSPITALITY', 0.14],
  ['LOGISTICS', 0.12],
  ['SKILLED_TRADES', 0.1],
  ['OFFICE_ADMIN', 0.08],
  ['INFORMATION_TECHNOLOGY', 0.07],
  ['EDUCATION', 0.07],
  ['AUTOMOTIVE', 0.06],
  ['AGRICULTURE', 0.05],
];

const TYPE_WEIGHTS: readonly (readonly [JobType, number])[] = [
  ['PART_TIME', 0.42],
  ['PAID_INTERNSHIP', 0.24],
  ['WORK_BASED_LEARNING_SITE', 0.22],
  ['FULL_TIME', 0.12],
];

const EMPLOYERS_PER_DISTRICT = 16;

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

function employerName(rng: Rng, field: CareerField, used: Set<string>): string {
  for (let attempt = 0; attempt < 40; attempt++) {
    const name = `${pick(rng, PREFIX)} ${pick(rng, KIND[field])}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  const fallback = `${pick(rng, PREFIX)} ${pick(rng, KIND[field])} ${used.size}`;
  used.add(fallback);
  return fallback;
}

export function buildEmployers(seed: number, localities: Locality[]): EmployerBundle {
  const rng = subRng(seed, 'employers');
  const employers: Employer[] = [];
  const postings: JobPosting[] = [];
  const usedNames = new Set<string>();

  const districts = [...new Set(localities.map((l) => l.darsDistrictId))].sort();

  for (const districtId of districts) {
    // Employers cluster where people live: urban localities are twice as likely.
    const places = localities.filter((l) => l.darsDistrictId === districtId);
    const weighted = places.map((l) => [l, l.isRural ? 1 : 2] as const);

    for (let i = 0; i < EMPLOYERS_PER_DISTRICT; i++) {
      // Every field appears at least once per district, so any student's interest can
      // find a match somewhere nearby.
      const field =
        i < CAREER_FIELDS.length ? CAREER_FIELDS[i]! : weightedPick(rng, FIELD_WEIGHTS);
      const locality = weightedPick(rng, weighted);
      const employer: Employer = {
        id: `DEMO-EMP-${pad(employers.length + 1, 4)}`,
        name: employerName(rng, field, usedNames),
        industry: field,
        localityFips: locality.fips,
        darsDistrictId: districtId,
        repeatPartner: chance(rng, 0.45),
      };
      employers.push(employer);

      const count = weightedPick(rng, [
        [1, 0.5],
        [2, 0.35],
        [3, 0.15],
      ] as const);
      const titles = shuffle(rng, TITLES[field]);
      for (let j = 0; j < count; j++) {
        const [title, low, high] = titles[j % titles.length]!;
        const type = weightedPick(rng, TYPE_WEIGHTS);
        const daysAgo = randInt(rng, 2, 75);
        const posted = new Date(REFERENCE_DATE.getTime() - daysAgo * 86_400_000);
        postings.push({
          id: `DEMO-JOB-${pad(postings.length + 1, 4)}`,
          employerId: employer.id,
          title,
          field,
          type,
          hourlyWage: Math.round(randFloat(rng, low, high) * 4) / 4,
          hoursPerWeek:
            type === 'FULL_TIME'
              ? 40
              : type === 'WORK_BASED_LEARNING_SITE'
                ? randInt(rng, 6, 12)
                : randInt(rng, 12, 24),
          openings: weightedPick(rng, [
            [1, 0.55],
            [2, 0.3],
            [3, 0.15],
          ] as const),
          postedAt: posted.toISOString().slice(0, 10),
          accommodations: shuffle(rng, ACCOMMODATIONS).slice(0, randInt(rng, 1, 3)),
          transitAccessible: locality.isRural ? chance(rng, 0.25) : chance(rng, 0.75),
        });
      }
    }
  }

  return { employers, postings };
}
