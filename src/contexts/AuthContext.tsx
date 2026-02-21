import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface SubscriptionInfo {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionInfo;
  checkingSubscription: boolean;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACADEMY_PRODUCT_ID = 'prod_U16E6wUG0UH4Bh';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    subscribed: false,
    product_id: null,
    subscription_end: null,
  });
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  const checkSubscription = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.access_token) {
      setSubscription({ subscribed: false, product_id: null, subscription_end: null });
      return;
    }

    setCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });

      if (error) {
        console.warn('Subscription check failed:', error);
        return;
      }

      setSubscription({
        subscribed: data?.subscribed ?? false,
        product_id: data?.product_id ?? null,
        subscription_end: data?.subscription_end ?? null,
      });
    } catch (err) {
      console.warn('Subscription check error:', err);
    } finally {
      setCheckingSubscription(false);
    }
  }, []);

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        // Check subscription on auth change
        await checkSubscription(newSession);
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
      checkSubscription(initialSession);
    });

    return () => authSub.unsubscribe();
  }, [checkSubscription]);

  // Periodic subscription refresh (every 60s)
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => checkSubscription(session), 60_000);
    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscription({ subscribed: false, product_id: null, subscription_end: null });
  };

  const refreshSubscription = useCallback(async () => {
    await checkSubscription(session);
  }, [session, checkSubscription]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      subscription,
      checkingSubscription,
      signOut,
      refreshSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ACADEMY_PRODUCT_ID };
