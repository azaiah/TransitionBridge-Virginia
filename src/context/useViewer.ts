'use client';

import { usePathname } from 'next/navigation';
import { getDefaultPersonaFor, getPersonaById } from '@/data';
import type { Persona, Role } from '@/data/types';
import { roleForPath } from '@/lib/portal';
import { useRoleOptional } from './RoleContext';

export interface Viewer {
  role: Role | null;
  persona: Persona | undefined;
}

/**
 * Who is looking at this screen: the portal's role and the persona in it. The portal (from
 * the path) wins over whatever was chosen last, so access rules always match the screen.
 */
export function useViewer(): Viewer {
  const pathname = usePathname();
  const ctx = useRoleOptional();
  const role = roleForPath(pathname) ?? ctx?.role ?? null;
  if (!role) return { role: null, persona: undefined };
  const chosen = ctx?.personaId ? getPersonaById(ctx.personaId) : undefined;
  const persona = chosen && chosen.role === role ? chosen : getDefaultPersonaFor(role);
  return { role, persona };
}

export const ROLE_NAMES: Record<Role, string> = {
  state_leadership: 'State leadership',
  dars_counselor: 'DARS counselor',
  school_coordinator: 'School coordinator',
  vendor: 'Provider',
};
