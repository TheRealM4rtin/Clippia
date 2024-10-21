'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';

const PremiumHomePage: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="window" style={{ width: 300 }}>
      <div className="title-bar">
        <div className="title-bar-text">Premium Home</div>
      </div>
      <div className="window-body">
        <p>Welcome, {session.user.email}!</p>
        <p>You have access to premium features!</p>
        <button onClick={handleSignOut}>Sign Out</button>
      </div>
    </div>
  );
};

export default PremiumHomePage;
