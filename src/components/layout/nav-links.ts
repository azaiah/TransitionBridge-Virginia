import { Building2, ClipboardList, School, Handshake, type LucideIcon } from 'lucide-react';

/** The four points of view, in the order they appear everywhere in the product. */
export interface RoleLink {
  label: string;
  /** Two words at most — this label also has to fit a phone's bottom bar. */
  shortLabel: string;
  href: string;
  icon: LucideIcon;
}

export const ROLE_LINKS: RoleLink[] = [
  { label: 'State leadership', shortLabel: 'State', href: '/state/', icon: Building2 },
  { label: 'DARS counselor', shortLabel: 'Counselor', href: '/dars/', icon: ClipboardList },
  { label: 'School coordinator', shortLabel: 'School', href: '/school/', icon: School },
  { label: 'Vendor', shortLabel: 'Provider', href: '/vendor/', icon: Handshake },
];
