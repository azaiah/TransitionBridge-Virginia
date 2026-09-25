/**
 * Which portal a page belongs to, read from its path. The portal you are standing in
 * decides whose view you see — so navigating from the state screens to /dars/ with the
 * side menu always shows the counselor's view, never a stale role from the last screen.
 */
import type { Role } from '@/data/types';

const PREFIXES: readonly [string, Role][] = [
  ['/state', 'state_leadership'],
  ['/dars', 'dars_counselor'],
  ['/school', 'school_coordinator'],
  ['/vendor', 'vendor'],
];

export function roleForPath(pathname: string | null | undefined): Role | null {
  if (!pathname) return null;
  for (const [prefix, role] of PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return role;
  }
  return null;
}

/** The home of each portal, for "back" links and search results. */
export const PORTAL_HOME: Record<Role, string> = {
  state_leadership: '/state/',
  dars_counselor: '/dars/',
  school_coordinator: '/school/',
  vendor: '/vendor/',
};

/** Where each portal opens a student's transition record. */
export const RECORD_PATH: Record<Role, string> = {
  state_leadership: '/state/students/detail/',
  dars_counselor: '/dars/students/detail/',
  school_coordinator: '/school/students/detail/',
  vendor: '/vendor/students/detail/',
};

export function recordHref(role: Role, studentId: string): string {
  return `${RECORD_PATH[role]}?id=${encodeURIComponent(studentId)}`;
}
