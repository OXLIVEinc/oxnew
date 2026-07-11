import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { AuthLoadingScreen } from '@/components/AuthLoading';
import { normalizePhone } from "@/utils";
import { useToast } from "@/hooks/use-toast"; // we'll use it inside context if needed, or pass callbacks

export type UserRole = 'admin' | 'organizer' | 'guest' | 'hotel_partner' | null;
type Profile = Tables<'profiles'>;

interface AuthContextValue {
  session: Session | null;
  authUser: SupabaseUser | null;
  profile: Profile | null;
  user: Profile | null;
  role: UserRole;
  loading: boolean;
  isAdmin: boolean;
  isOrganizer: boolean;
  isGuest: boolean;
  isHotelPartner: boolean;

  signOut: () => Promise<void>;
  refresh: () => Promise<void>;

  // New auth methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: {
    email: string;
    password: string;
    displayName?: string;
    role: "organizer" | "guest" | "hotel_partner";
    phone?: string;        // for organizer/guest
    whatsapp?: string;     // for hotel_partner
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast(); // you can also choose to pass toast callbacks from components

  const loadProfileAndRole = useCallback(async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    setProfile(profileData ?? null);
    if (!profileData) {
      setRole(null);
      return;
    }

    const { data: roleRows } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', profileData.id);

    const roles = roleRows?.map((r) => r.role) ?? [];
    if (roles.includes('admin')) setRole('admin');
    else if (roles.includes('organizer')) setRole('organizer');
    else if (roles.includes('hotel_partner')) setRole('hotel_partner');
    else if (roles.includes('guest')) setRole('guest');
    else setRole(null);
  }, []);

  const hydrate = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    setAuthUser(nextSession?.user ?? null);
    if (nextSession?.user) {
      await loadProfileAndRole(nextSession.user.id);
    } else {
      setProfile(null);
      setRole(null);
    }
  }, [loadProfileAndRole]);

  // ==================== NEW: Sign In ====================
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    toast({
      title: "Welcome back!",
      description: "You have successfully signed in.",
    });
  }, [toast]);

  // ==================== NEW: Sign Up ====================
  const signUp = useCallback(async ({
    email,
    password,
    displayName,
    role: selectedRole,
    phone,
    whatsapp,
  }: {
    email: string;
    password: string;
    displayName?: string;
    role: "organizer" | "guest" | "hotel_partner";
    phone?: string;
    whatsapp?: string;
  }) => {
    const phoneNumber = normalizePhone(
      selectedRole === "hotel_partner" ? whatsapp! : phone!
    );

    // Check existing profile (email or phone)
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, phone")
      .or(`email.eq.${email},phone.eq.${phoneNumber}`)
      .maybeSingle();

    if (profileError) throw profileError;

    if (existingProfile) {
      if (existingProfile.email === email) {
        throw new Error("An account with this email already exists.");
      } else {
        throw new Error("An account with this phone number already exists.");
      }
    }

    // Role-specific validation
    if (selectedRole === "hotel_partner") {
      if (!whatsapp?.trim()) throw new Error("WhatsApp number is required for Hotel Partner");
    } else if (!phone?.trim()) {
      throw new Error("Phone number is required");
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          display_name: displayName || email.split("@")[0],
          phone: selectedRole === "hotel_partner" ? whatsapp : phone,
          whatsapp: selectedRole === "hotel_partner" ? whatsapp : null,
          role: selectedRole,
        },
      },
    });

    if (error) throw error;

    toast({
      title: "Account created!",
      description: "Please check your email to verify your account.",
    });
  }, [toast]);

  // Existing effects...
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      await hydrate(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      hydrate(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrate]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refresh = useCallback(async () => {
    if (authUser) await loadProfileAndRole(authUser.id);
  }, [authUser, loadProfileAndRole]);

  const value: AuthContextValue = {
    session,
    authUser,
    profile,
    user: profile,
    role,
    loading,
    isAdmin: role === 'admin',
    isOrganizer: role === 'organizer' || role === 'admin',
    isGuest: role === 'guest',
    isHotelPartner: role === 'hotel_partner',
    signOut,
    refresh,
    signIn,
    signUp,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <AuthLoadingScreen /> : children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}