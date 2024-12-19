'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  refreshAuth: () => Promise<void>;
  supabase: SupabaseClient<Database> | null;
}

// Initial context value without Supabase client
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  refreshAuth: async () => {},
  supabase: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
  const [isClient, setIsClient] = useState(false);

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
  }, [isClient, refreshAuth]);

  const refreshAuth = useCallback(async () => {
    if (!supabase) return;

    try {
      console.log('Refreshing auth state...');
      const { data: { session: newSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        throw error;
      }

      console.log('Auth refresh result:', {
        hasSession: !!newSession,
        userId: newSession?.user?.id
      });

      if (newSession) {
        // Update both session and user state
        setSession(newSession);
        setUser(newSession.user);
        
        // Update Supabase client session
        await supabase.auth.setSession({
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token,
        });
      } else {
        console.log('No active session found');
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Set up auth state listener after client is initialized
  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', { event, userId: newSession?.user?.id });
      
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
        
        // Ensure session is properly set in Supabase client
        await supabase.auth.setSession({
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token,
        });
      } else {
        setSession(null);
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = {
    user,
    session,
    loading,
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
