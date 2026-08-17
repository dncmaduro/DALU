import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/permissions";

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthState | null>(null);
async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refreshProfile = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    if (!data.session) {
      setProfile(null);
      return;
    }
    const next = await fetchProfile(data.session.user.id);
    setProfile(next);
  };
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        setSession(data.session);
        if (data.session) setProfile(await fetchProfile(data.session.user.id));
      } catch (cause) {
        if (alive)
          setError(
            cause instanceof Error
              ? cause
              : new Error("Không thể lấy hồ sơ người dùng."),
          );
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!alive) return;
        setSession(nextSession);
        if (!nextSession) {
          setProfile(null);
          setLoading(false);
          return;
        }
        void fetchProfile(nextSession.user.id)
          .then(setProfile)
          .catch((cause: unknown) =>
            setError(
              cause instanceof Error
                ? cause
                : new Error("Không thể lấy hồ sơ người dùng."),
            ),
          )
          .finally(() => setLoading(false));
      },
    );
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
  };
  return (
    <AuthContext.Provider
      value={{ session, profile, loading, error, refreshProfile, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải được dùng trong AuthProvider.");
  return context;
}
