'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const SubscribePage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [stripe, setStripe] = useState<Stripe | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const stripeInstance = await stripePromise;
        setStripe(stripeInstance);
        console.log('Stripe initialized successfully');
      } catch (err) {
        console.error('Error initializing Stripe:', err);
        setError('Failed to initialize payment system. Please try again later.');
      }
    };

    initializeStripe();
  }, []);

  const handleSubscribe = async () => {
    console.log('handleSubscribe called');
    setError(null);
    
    if (!stripe) {
      setError('Payment system is not ready. Please try again later.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User:', user);

      if (!user) {
        throw new Error('User not logged in. Please log in to subscribe.');
      }

      console.log('Sending request to create-checkout-session');
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const session = await response.json();
      console.log('Session:', session);
      
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (err: unknown) {
      console.error('Error in subscription process:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during the subscription process. Please try again.');
    }
  };

  return (
    <div className="window" style={{ width: 300 }}>
      <div className="title-bar">
        <div className="title-bar-text">Subscribe</div>
      </div>
      <div className="window-body">
        <p>Subscribe to gain access to our services.</p>
        <button onClick={handleSubscribe} disabled={!stripe}>Subscribe Now</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
};

export default SubscribePage;
