import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import styles from './LoginTab.module.css';
// import ButtonPanel from '@/components/ButtonPanel';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface LoginTabProps {
  width: number;
}

const LoginTab: React.FC<LoginTabProps> = ({ width }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else if (data.user) {
      // Check subscription status
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', data.user.id)
        .single();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('Error fetching subscription status:', subscriptionError);
      }

      if (subscriptionData?.status === 'active' || subscriptionData?.status === 'lifetime') {
        router.push('/premium-home');
      } else if (!subscriptionData) {
        // New user, create a free subscription
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({ user_id: data.user.id, status: 'free' });

        if (insertError) {
          console.error('Error creating free subscription:', insertError);
        }
        router.push('/home');
      } else {
        router.push('/home');
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubscribe = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const stripe = await stripePromise;
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
    });
    const session = await response.json();
    const result = await stripe!.redirectToCheckout({
      sessionId: session.id,
    });
    if (result.error) {
      setError(result.error.message ?? 'An error occurred during checkout');
    }
  };

  return (
    <div className={styles.loginTab} style={{ width: width - 12 }}>
      <div className={styles.inputGroup}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className={styles.buttonGroup}>
        <button disabled>Login (soon)</button>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      <strong className={styles.subscriptionMessage}>✨Take a sub and access premium features ✨</strong>
    </div>
  );
};

export default LoginTab;
