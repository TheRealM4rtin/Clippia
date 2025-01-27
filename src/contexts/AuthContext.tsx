'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import { AuthUser, Session } from '@/types/auth';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  hasPaidPlan: boolean;
  refreshAuth: () => Promise<void>;
  supabase: SupabaseClient<Database> | null;
}

// Initial context value without Supabase client
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  hasPaidPlan: false,
  refreshAuth: async () => { },
  supabase: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPaidPlan, setHasPaidPlan] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Define checkSubscription first
  const checkSubscription = useCallback(async (userId: string) => {
    try {
      console.log('🔄 Checking subscription in AuthContext for user:', userId);
      if (!supabase) return;

      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error('❌ Error fetching subscription:', error);
        setHasPaidPlan(false);
        return;
      }

      const validPlans = ["early_adopter", "support", "paid", "basic", "lifetime"];
      const hasPaidAccess = subscription?.status === "active" &&
        validPlans.includes(subscription.plan);

      console.log('✅ Subscription check result:', { hasSubscription: hasPaidAccess });
      setHasPaidPlan(hasPaidAccess);
    } catch (error) {
      console.error('❌ Error checking subscription:', error);
      setHasPaidPlan(false);
    }
  }, [supabase]);

  // Then define refreshAuth
  const refreshAuth = useCallback(async () => {
    if (!supabase) return;

    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const authUser: AuthUser = {
        ...currentSession.user,
        email: currentSession.user.email || null,
        customer_id: null,
        subscription_id: null,
        subscription_status: null,
        subscription_tier: null,
        subscription_updated_at: null,
        updated_at: currentSession.user.updated_at || null
      };

      setUser(authUser);
      setSession({
        ...currentSession,
        user: authUser
      } as Session);

      await checkSubscription(authUser.id);
    }
    setLoading(false);
  }, [supabase, checkSubscription]);

  // Initialize Supabase client on mount (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const client = getSupabaseClient();
    if (client) {
      setSupabase(client);
      // Immediately check session when client is set
      refreshAuth();
    }
  }, [isClient]);

  // Set up auth state listener after client is initialized
  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', { event, userId: newSession?.user?.id });

      if (newSession) {
        // Transform the user data to match AuthUser interface
        const authUser: AuthUser = {
          ...newSession.user,
          email: newSession.user.email || null,
          customer_id: null,
          subscription_id: null,
          subscription_status: null,
          subscription_tier: null,
          subscription_updated_at: null,
          updated_at: newSession.user.updated_at || null
        };

        setSession({
          ...newSession,
          user: authUser
        });
        setUser(authUser);

        // Check subscription status
        await checkSubscription(authUser.id);

        // Initialize whiteboard if needed
        try {
          console.log('🎨 Checking for existing whiteboard...');
          const { error } = await supabase
            .from('whiteboards')
            .select('id')
            .eq('user_id', authUser.id)
            .single();

          if (error && error.code === 'PGRST116') {
            console.log('📝 Creating initial whiteboard for user:', authUser.id);
            const defaultWhiteboard = {
              user_id: authUser.id,
              name: "My Whiteboard",
              data: JSON.stringify({
                nodes: [],
                edges: [],
                viewport: { x: 0, y: 0, zoom: 1 },
              }),
              version: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const { error: createError } = await supabase
              .from('whiteboards')
              .insert(defaultWhiteboard);

            if (createError) {
              console.error('❌ Error creating whiteboard:', createError);
            } else {
              console.log('✅ Initial whiteboard created successfully');
            }
          }
        } catch (error) {
          console.error('❌ Error checking/creating whiteboard:', error);
        }

        // Ensure session is properly set in Supabase client
        await supabase.auth.setSession({
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token,
        });
      } else {
        setSession(null);
        setUser(null);
        setHasPaidPlan(false);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, checkSubscription]);

  const value = {
    user,
    session,
    loading,
    hasPaidPlan,
    refreshAuth,
    supabase,
  };

  // Show loading state during hydration
  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
