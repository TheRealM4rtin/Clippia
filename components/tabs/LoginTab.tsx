import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ButtonPanel from '@/components/ButtonPanel';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const LoginTab: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
    <div>
      <div className="field-row-stacked" style={{ width: '200px' }}>
        <label htmlFor="text22">Email</label>
        <input
          id="text22"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="field-row-stacked" style={{ width: '200px' }}>
        <label htmlFor="text23">Password</label>
        <input
          id="text23"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <ButtonPanel>
        <ButtonPanel.Button onClick={handleLogin}>
          Login
        </ButtonPanel.Button>
        <ButtonPanel.Button onClick={handleSubscribe}>
          Take a sub
        </ButtonPanel.Button>
      </ButtonPanel>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <strong style={{ color: 'purple' }}>✨Take a sub and access premium features ✨</strong>
    </div>
  );
};

export default LoginTab;