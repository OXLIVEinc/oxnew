import { useAuth } from '@/context/AuthContext';

export type UserRole = 'admin' | 'organizer' | 'guest' | 'hotel_partner' | null;

/**
 * @deprecated Prefer importing `useAuth` from `@/context/AuthContext` directly.
 * This wrapper exists so existing components keep working, but it no longer
 * does its own Supabase fetch/listener — it just reads from the shared
 * AuthContext, which resolves once for the whole app.
 */
export function useUserRole() {
  const { user, profile, role, loading, isAdmin, isOrganizer, isGuest, isHotelPartner } =
    useAuth();

  return { user, profile, role, loading, isAdmin, isOrganizer, isGuest, isHotelPartner };
}
