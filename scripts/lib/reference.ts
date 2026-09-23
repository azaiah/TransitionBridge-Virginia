/**
 * Real public reference data: the Virginia localities, the six DARS districts, and the
 * 132 school divisions. Everything in this file is public-record structure. Everything
 * that HAPPENS on this structure is generated (docs/05_DEMO_DATA.md §1.5).
 *
 * ⚠️ The district assignment reflects the published DRS district map dated 09/25/2021.
 *    docs/09_OPEN_ITEMS.md §1.2 tracks confirming it is still current before any live
 *    presentation. It is geography, not personnel — no staff name appears anywhere.
 */

export const DISTRICT_DEFS = [
  { id: 'northern', name: 'Northern District', officeCount: 8 },
  { id: 'capital', name: 'Capital District', officeCount: 7 },
  { id: 'hampton-roads', name: 'Hampton Roads District', officeCount: 7 },
  { id: 'new-river', name: 'New River District', officeCount: 6 },
  { id: 'skyline', name: 'Skyline District', officeCount: 5 },
  { id: 'southwest', name: 'Southwest District', officeCount: 3 },
] as const;

export type DistrictId = (typeof DISTRICT_DEFS)[number]['id'];

/** Every one of the 133 localities, assigned to exactly one district. */
export const LOCALITY_DISTRICT: Record<string, DistrictId> = {
  // ---- Southwest (16) ----
  '51027': 'southwest', // Buchanan County
  '51051': 'southwest', // Dickenson County
  '51105': 'southwest', // Lee County
  '51167': 'southwest', // Russell County
  '51169': 'southwest', // Scott County
  '51173': 'southwest', // Smyth County
  '51185': 'southwest', // Tazewell County
  '51191': 'southwest', // Washington County
  '51195': 'southwest', // Wise County
  '51197': 'southwest', // Wythe County
  '51021': 'southwest', // Bland County
  '51077': 'southwest', // Grayson County
  '51035': 'southwest', // Carroll County
  '51520': 'southwest', // Bristol City
  '51720': 'southwest', // Norton City
  '51640': 'southwest', // Galax City

  // ---- New River (22) ----
  '51121': 'new-river', // Montgomery County
  '51155': 'new-river', // Pulaski County
  '51063': 'new-river', // Floyd County
  '51071': 'new-river', // Giles County
  '51750': 'new-river', // Radford City
  '51161': 'new-river', // Roanoke County
  '51770': 'new-river', // Roanoke City
  '51775': 'new-river', // Salem City
  '51023': 'new-river', // Botetourt County
  '51045': 'new-river', // Craig County
  '51067': 'new-river', // Franklin County
  '51089': 'new-river', // Henry County
  '51141': 'new-river', // Patrick County
  '51690': 'new-river', // Martinsville City
  '51143': 'new-river', // Pittsylvania County
  '51590': 'new-river', // Danville City
  '51083': 'new-river', // Halifax County
  '51019': 'new-river', // Bedford County
  '51031': 'new-river', // Campbell County
  '51680': 'new-river', // Lynchburg City
  '51009': 'new-river', // Amherst County
  '51011': 'new-river', // Appomattox County

  // ---- Skyline (26) ----
  '51069': 'skyline', // Frederick County
  '51840': 'skyline', // Winchester City
  '51043': 'skyline', // Clarke County
  '51187': 'skyline', // Warren County
  '51171': 'skyline', // Shenandoah County
  '51139': 'skyline', // Page County
  '51165': 'skyline', // Rockingham County
  '51660': 'skyline', // Harrisonburg City
  '51015': 'skyline', // Augusta County
  '51790': 'skyline', // Staunton City
  '51820': 'skyline', // Waynesboro City
  '51091': 'skyline', // Highland County
  '51017': 'skyline', // Bath County
  '51163': 'skyline', // Rockbridge County
  '51678': 'skyline', // Lexington City
  '51530': 'skyline', // Buena Vista City
  '51005': 'skyline', // Alleghany County
  '51580': 'skyline', // Covington City
  '51003': 'skyline', // Albemarle County
  '51540': 'skyline', // Charlottesville City
  '51079': 'skyline', // Greene County
  '51113': 'skyline', // Madison County
  '51125': 'skyline', // Nelson County
  '51065': 'skyline', // Fluvanna County
  '51109': 'skyline', // Louisa County
  '51137': 'skyline', // Orange County

  // ---- Northern (22) ----
  '51059': 'northern', // Fairfax County
  '51600': 'northern', // Fairfax City
  '51610': 'northern', // Falls Church City
  '51013': 'northern', // Arlington County
  '51510': 'northern', // Alexandria City
  '51107': 'northern', // Loudoun County
  '51153': 'northern', // Prince William County
  '51683': 'northern', // Manassas City
  '51685': 'northern', // Manassas Park City
  '51061': 'northern', // Fauquier County
  '51157': 'northern', // Rappahannock County
  '51047': 'northern', // Culpeper County
  '51179': 'northern', // Stafford County
  '51177': 'northern', // Spotsylvania County
  '51630': 'northern', // Fredericksburg City
  '51099': 'northern', // King George County
  '51193': 'northern', // Westmoreland County
  '51133': 'northern', // Northumberland County
  '51159': 'northern', // Richmond County
  '51103': 'northern', // Lancaster County
  '51057': 'northern', // Essex County
  '51033': 'northern', // Caroline County

  // ---- Capital (27) ----
  '51760': 'capital', // Richmond City
  '51087': 'capital', // Henrico County
  '51041': 'capital', // Chesterfield County
  '51085': 'capital', // Hanover County
  '51075': 'capital', // Goochland County
  '51145': 'capital', // Powhatan County
  '51007': 'capital', // Amelia County
  '51135': 'capital', // Nottoway County
  '51147': 'capital', // Prince Edward County
  '51049': 'capital', // Cumberland County
  '51029': 'capital', // Buckingham County
  '51037': 'capital', // Charlotte County
  '51111': 'capital', // Lunenburg County
  '51117': 'capital', // Mecklenburg County
  '51025': 'capital', // Brunswick County
  '51053': 'capital', // Dinwiddie County
  '51730': 'capital', // Petersburg City
  '51570': 'capital', // Colonial Heights City
  '51670': 'capital', // Hopewell City
  '51149': 'capital', // Prince George County
  '51183': 'capital', // Sussex County
  '51081': 'capital', // Greensville County
  '51595': 'capital', // Emporia City
  '51036': 'capital', // Charles City County
  '51127': 'capital', // New Kent County
  '51101': 'capital', // King William County
  '51097': 'capital', // King and Queen County

  // ---- Hampton Roads (20) ----
  '51710': 'hampton-roads', // Norfolk City
  '51810': 'hampton-roads', // Virginia Beach City
  '51550': 'hampton-roads', // Chesapeake City
  '51740': 'hampton-roads', // Portsmouth City
  '51800': 'hampton-roads', // Suffolk City
  '51650': 'hampton-roads', // Hampton City
  '51700': 'hampton-roads', // Newport News City
  '51735': 'hampton-roads', // Poquoson City
  '51199': 'hampton-roads', // York County
  '51830': 'hampton-roads', // Williamsburg City
  '51095': 'hampton-roads', // James City County
  '51073': 'hampton-roads', // Gloucester County
  '51115': 'hampton-roads', // Mathews County
  '51119': 'hampton-roads', // Middlesex County
  '51093': 'hampton-roads', // Isle of Wight County
  '51175': 'hampton-roads', // Southampton County
  '51620': 'hampton-roads', // Franklin City
  '51181': 'hampton-roads', // Surry County
  '51001': 'hampton-roads', // Accomack County
  '51131': 'hampton-roads', // Northampton County
};

/**
 * Localities inside a metropolitan core. Everything else is treated as rural, which is
 * what drives the coverage-gap narrative the 2025 CSNA documented.
 */
export const URBAN_FIPS = new Set<string>([
  // Northern Virginia
  '51059', '51600', '51610', '51013', '51510', '51107', '51153', '51683', '51685', '51179', '51177', '51630',
  // Hampton Roads
  '51710', '51810', '51550', '51740', '51800', '51650', '51700', '51735', '51199', '51095', '51830', '51093',
  // Richmond metro / Tri-Cities
  '51760', '51087', '51041', '51085', '51730', '51570', '51670', '51149',
  // Roanoke / Lynchburg / Danville
  '51161', '51770', '51775', '51121', '51750', '51680', '51031', '51019', '51590', '51023', '51089', '51690', '51143',
  // Shenandoah / Charlottesville
  '51003', '51540', '51660', '51165', '51015', '51790', '51820', '51840', '51069',
  // Southwest urban
  '51520', '51191',
]);

/**
 * School divisions that combine more than one locality. Virginia has three.
 * Each maps: division id -> the localities it serves, with the FIRST being the seat.
 */
export const COMBINED_DIVISIONS: { id: string; name: string; fips: string[] }[] = [
  { id: 'alleghany-highlands-public-schools', name: 'Alleghany Highlands Public Schools', fips: ['51005', '51580'] },
  {
    id: 'williamsburg-james-city-county-public-schools',
    name: 'Williamsburg-James City County Public Schools',
    fips: ['51095', '51830'],
  },
  { id: 'greensville-county-public-schools', name: 'Greensville County Public Schools', fips: ['51081', '51595'] },
];

/** Two town divisions that operate independently of their surrounding county. */
export const TOWN_DIVISIONS: { id: string; name: string; fips: string }[] = [
  { id: 'colonial-beach-public-schools', name: 'Colonial Beach Public Schools', fips: '51193' },
  { id: 'west-point-public-schools', name: 'West Point Public Schools', fips: '51101' },
];

/**
 * Approximate total K-12 enrollment per division, used ONLY as a relative size weight
 * so that referral volume tracks division size. Illustrative — never presented as a
 * VDOE-reported figure. Keyed by division id.
 */
export const DIVISION_ENROLLMENT: Record<string, number> = {
  // Northern
  'fairfax-county-public-schools': 178000,
  'prince-william-county-public-schools': 89000,
  'loudoun-county-public-schools': 82000,
  'arlington-county-public-schools': 27000,
  'stafford-county-public-schools': 29000,
  'spotsylvania-county-public-schools': 24000,
  'alexandria-city-public-schools': 15500,
  'fauquier-county-public-schools': 10500,
  'culpeper-county-public-schools': 8300,
  'manassas-city-public-schools': 7300,
  'king-george-county-public-schools': 4300,
  'caroline-county-public-schools': 4300,
  'manassas-park-city-public-schools': 3500,
  'fredericksburg-city-public-schools': 3400,
  'fairfax-city-public-schools': 3000,
  'falls-church-city-public-schools': 2700,
  'westmoreland-county-public-schools': 1600,
  'essex-county-public-schools': 1500,
  'northumberland-county-public-schools': 1300,
  'richmond-county-public-schools': 1300,
  'lancaster-county-public-schools': 1100,
  'rappahannock-county-public-schools': 850,
  'colonial-beach-public-schools': 500,

  // Capital
  'chesterfield-county-public-schools': 64000,
  'henrico-county-public-schools': 50000,
  'richmond-city-public-schools': 21500,
  'hanover-county-public-schools': 17000,
  'prince-george-county-public-schools': 6300,
  'powhatan-county-public-schools': 4300,
  'dinwiddie-county-public-schools': 4300,
  'mecklenburg-county-public-schools': 4200,
  'petersburg-city-public-schools': 4000,
  'hopewell-city-public-schools': 4000,
  'new-kent-county-public-schools': 3400,
  'colonial-heights-city-public-schools': 2900,
  'goochland-county-public-schools': 2500,
  'greensville-county-public-schools': 2200,
  'king-william-county-public-schools': 2100,
  'prince-edward-county-public-schools': 2100,
  'nottoway-county-public-schools': 2000,
  'buckingham-county-public-schools': 1900,
  'amelia-county-public-schools': 1700,
  'charlotte-county-public-schools': 1700,
  'lunenburg-county-public-schools': 1500,
  'brunswick-county-public-schools': 1500,
  'cumberland-county-public-schools': 1300,
  'sussex-county-public-schools': 1000,
  'west-point-public-schools': 800,
  'king-and-queen-county-public-schools': 800,
  'charles-city-county-public-schools': 600,

  // Hampton Roads
  'virginia-beach-city-public-schools': 65000,
  'chesapeake-city-public-schools': 40000,
  'norfolk-city-public-schools': 28000,
  'newport-news-city-public-schools': 27000,
  'hampton-city-public-schools': 19500,
  'suffolk-city-public-schools': 14500,
  'portsmouth-city-public-schools': 13500,
  'york-county-public-schools': 13000,
  'williamsburg-james-city-county-public-schools': 11500,
  'isle-of-wight-county-public-schools': 5500,
  'gloucester-county-public-schools': 5300,
  'accomack-county-public-schools': 4400,
  'southampton-county-public-schools': 2600,
  'poquoson-city-public-schools': 2000,
  'northampton-county-public-schools': 1500,
  'middlesex-county-public-schools': 1200,
  'mathews-county-public-schools': 1100,
  'franklin-city-public-schools': 1000,
  'surry-county-public-schools': 700,

  // New River
  'roanoke-county-public-schools': 13500,
  'roanoke-city-public-schools': 13500,
  'bedford-county-public-schools': 9500,
  'montgomery-county-public-schools': 9500,
  'lynchburg-city-public-schools': 8000,
  'pittsylvania-county-public-schools': 8000,
  'campbell-county-public-schools': 7500,
  'franklin-county-public-schools': 6800,
  'henry-county-public-schools': 6800,
  'danville-city-public-schools': 5800,
  'halifax-county-public-schools': 5000,
  'botetourt-county-public-schools': 4400,
  'pulaski-county-public-schools': 4000,
  'amherst-county-public-schools': 3900,
  'salem-city-public-schools': 3800,
  'patrick-county-public-schools': 2600,
  'giles-county-public-schools': 2300,
  'appomattox-county-public-schools': 2200,
  'martinsville-city-public-schools': 2000,
  'floyd-county-public-schools': 1900,
  'radford-city-public-schools': 1600,
  'craig-county-public-schools': 600,

  // Skyline
  'albemarle-county-public-schools': 14000,
  'frederick-county-public-schools': 14000,
  'rockingham-county-public-schools': 11500,
  'augusta-county-public-schools': 10000,
  'harrisonburg-city-public-schools': 6200,
  'shenandoah-county-public-schools': 6000,
  'orange-county-public-schools': 5300,
  'warren-county-public-schools': 5000,
  'louisa-county-public-schools': 4900,
  'charlottesville-city-public-schools': 4400,
  'winchester-city-public-schools': 4400,
  'fluvanna-county-public-schools': 3500,
  'page-county-public-schools': 3100,
  'waynesboro-city-public-schools': 3100,
  'greene-county-public-schools': 3000,
  'staunton-city-public-schools': 2600,
  'rockbridge-county-public-schools': 2600,
  'alleghany-highlands-public-schools': 2400,
  'clarke-county-public-schools': 2000,
  'madison-county-public-schools': 1700,
  'nelson-county-public-schools': 1600,
  'buena-vista-city-public-schools': 950,
  'lexington-city-public-schools': 650,
  'bath-county-public-schools': 550,
  'highland-county-public-schools': 200,

  // Southwest
  'washington-county-public-schools': 6600,
  'wise-county-public-schools': 5400,
  'tazewell-county-public-schools': 5300,
  'smyth-county-public-schools': 4100,
  'wythe-county-public-schools': 4000,
  'russell-county-public-schools': 3400,
  'scott-county-public-schools': 3400,
  'carroll-county-public-schools': 3300,
  'lee-county-public-schools': 2900,
  'buchanan-county-public-schools': 2500,
  'bristol-city-public-schools': 2000,
  'dickenson-county-public-schools': 1900,
  'grayson-county-public-schools': 1600,
  'galax-city-public-schools': 1300,
  'norton-city-public-schools': 850,
  'bland-county-public-schools': 750,
};

/**
 * Blocklist. No generated name may collide with a real Virginia ESO or a real named
 * public official. Enforced by tests/data-integrity.test.ts (docs/05_DEMO_DATA.md §5.7).
 */
export const REAL_NAME_BLOCKLIST: string[] = [
  // Real named public officials referenced in internal docs only (CLAUDE.md §1.3)
  'Donna Bonessi',
  'Stephanie Carter',
  'Daryl Washington',
  'Marvin Figueroa',
  'Tracy Harrington',
  'Michele Wells-Escobar',
  'Cindy Matney',
  'Sherrina Sewell',
  'Kimberly Shepard',
  'John Jackson',
  'Michelle Pettaway',
  // Real Virginia ESO / community rehabilitation program names and common fragments
  'Goodwill',
  'Easterseals',
  'Easter Seals',
  'ServiceSource',
  'Didlake',
  'Melwood',
  'Chesapeake Bay Academy',
  'Elk Hill',
  'Hope House',
  'Rappahannock Goodwill',
  'Virginia Industries for the Blind',
  'Wilson Workforce',
  'Woodrow Wilson Rehabilitation',
  'St. Joseph',
  'Saint Joseph',
  'Salvation Army',
  'United Way',
  'Arc of Virginia',
  'The Arc',
  'Brain Injury Services',
  'Job Corps',
  'Vocational Rehabilitation Services Inc',
  'Career Works',
  'Alliance Enterprises',
  'Libera',
  'Aware',
];

/** Words that must never appear in the shipped output. CLAUDE.md §1.1. */
export const STACK_WORD_BLOCKLIST: string[] = [
  'next.js',
  'nextjs',
  'react',
  'tailwind',
  'recharts',
  'vercel',
  'netlify',
  'typescript',
  'javascript',
  'node.js',
  'nodejs',
  'npm',
  'webpack',
  'turbopack',
  'shadcn',
  'lucide',
  'topojson',
  'd3',
  'vitest',
  'postgres',
  'supabase',
  'firebase',
  'aws',
  'azure',
  'cloudflare',
  'github',
  'dataisdata',
];
