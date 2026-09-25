'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Role } from '@/data/types';
import { ROLES } from '@/data/types';
import { demoData } from '@/data';
import { getPersonaForRole, getRoleConfig } from '@/lib/marketing';
import { startSession } from '@/lib/demo-session';
import { roleForPath } from '@/lib/portal';

type RoleContextValue = {
  role: Role | null;
  personaId: string | null;
  personaName: string | null;
  setRole: (role: Role, destination?: string) => void;
  isTransitioning: boolean;
};

const RoleContext = createContext<RoleContextValue | null>(null);

const STORAGE_KEY = 'tb-demo-role';

function isRole(value: string | null): value is Role {
  return value !== null && (ROLES as readonly string[]).includes(value);
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const portalRole = roleForPath(pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const urlRole = searchParams.get('role');
  const urlPersona = searchParams.get('persona');

  const [role, setRoleState] = useState<Role | null>(() => {
    // The portal you are in wins: /dars/ is always the counselor's view.
    if (portalRole) return portalRole;
    if (isRole(urlRole)) return urlRole;
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (isRole(stored)) return stored;
    }
    return null;
  });

  const [personaId, setPersonaId] = useState<string | null>(() => {
    if (portalRole && urlRole !== portalRole) return getPersonaForRole(portalRole)?.id ?? null;
    if (urlPersona) return urlPersona;
    if (isRole(urlRole)) return getPersonaForRole(urlRole)?.id ?? null;
    return null;
  });

  // Sync from URL when it changes (e.g. back/forward).
  useEffect(() => {
    // Inside a portal the path decides (effect below); the URL only breaks a tie off-portal.
    if (portalRole && urlRole !== portalRole) return;
    if (isRole(urlRole) && urlRole !== role) {
      setRoleState(urlRole);
      setPersonaId(urlPersona ?? getPersonaForRole(urlRole)?.id ?? null);
      sessionStorage.setItem(STORAGE_KEY, urlRole);
    }
  }, [urlRole, urlPersona, role, portalRole]);

  // Moving between portals with the side menu or a link changes whose view this is. Without
  // this the header said "School coordinator" on the state screens, and a counselor page
  // could try to read a school persona's scope as a district.
  useEffect(() => {
    if (!portalRole || portalRole === role) return;
    setRoleState(portalRole);
    const fromUrl =
      urlPersona && demoData.personas.some((p) => p.id === urlPersona && p.role === portalRole)
        ? urlPersona
        : null;
    setPersonaId(fromUrl ?? getPersonaForRole(portalRole)?.id ?? null);
    try {
      sessionStorage.setItem(STORAGE_KEY, portalRole);
    } catch {
      // Storage blocked: the header still updates for this page.
    }
  }, [portalRole, role, urlPersona]);

  const personaName = useMemo(() => {
    if (!role) return null;
    const persona = personaId
      ? demoData.personas.find((p) => p.id === personaId)
      : getPersonaForRole(role);
    return persona?.displayName ?? null;
  }, [role, personaId]);

  /**
   * Switches the view to a role and navigates to it.
   * `destination` is optional: the sign-in screen passes the page the visitor was trying
   * to open, so they land back where they were instead of on the role's home page.
   */
  const setRole = useCallback(
    (next: Role, destination?: string) => {
      const persona = getPersonaForRole(next);
      setIsTransitioning(true);
      setRoleState(next);
      setPersonaId(persona?.id ?? null);
      sessionStorage.setItem(STORAGE_KEY, next);
      // Picking any view counts as "signed in" for the demo gate on the portal pages.
      startSession(next);

      const config = getRoleConfig(next);
      // With a destination, keep ITS query (e.g. a filter). Without one, keep the
      // current query, as before. 'next' only matters on the sign-in screen, so drop it.
      const [targetPath, targetQuery] = destination
        ? destination.split('?')
        : [config?.href ?? '/sign-in/', searchParams.toString()];
      const params = new URLSearchParams(targetQuery ?? '');
      params.delete('next');
      params.set('role', next);
      if (persona) params.set('persona', persona.id);
      else params.delete('persona');

      router.push(`${targetPath}?${params.toString()}`);

      window.setTimeout(() => setIsTransitioning(false), 320);
    },
    [router, searchParams],
  );

  const value = useMemo(
    () => ({ role, personaId, personaName, setRole, isTransitioning }),
    [role, personaId, personaName, setRole, isTransitioning],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}

/** Safe hook for components that may render outside provider. */
export function useRoleOptional() {
  return useContext(RoleContext);
}
