'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import styles from './LoginTab.module.css';
import { z } from 'zod';
import { signUp, checkVerificationStatus, resendVerificationEmail } from '@/lib/auth';
import { differenceInDays, differenceInHours } from 'date-fns';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const emailSchema = z.string().email('Invalid email address');

interface LoginTabProps {
  width: number;
}

interface VerificationStatus {
  isVerified: boolean;
  timeRemaining: string;
}

const LoginTab: React.FC<LoginTabProps> = ({ width }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    isVerified: true,
    timeRemaining: ''
  });
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const checkVerificationStatus = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('email_verification_deadline')
      .eq('id', user.id)
      .single();

    if (profile) {
      if (!profile.email_verification_deadline) {
        const deadline = new Date(Date.now() + (3 * 24 * 60 * 60 * 1000));
        await supabase
          .from('profiles')
          .update({ email_verification_deadline: deadline.toISOString() })
          .eq('id', user.id);
        profile.email_verification_deadline = deadline.toISOString();
      }

      const deadline = new Date(profile.email_verification_deadline);
      const now = new Date();
      const days = differenceInDays(deadline, now);
      const hours = differenceInHours(deadline, now) % 24;

      let timeRemaining = '';
      if (days > 0) {
        timeRemaining = `${days} days and ${hours} hours`;
      } else if (hours > 0) {
        timeRemaining = `${hours} hours`;
      } else {
        timeRemaining = 'Time expired';
      }

      setVerificationStatus({
        isVerified: false,
        timeRemaining
      });
    }
  }, [supabase]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        checkVerificationStatus();
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkVerificationStatus();
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, checkVerificationStatus]);

  const validateInput = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (isRegistering && password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message);
      } else {
        setError((error as Error).message);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!validateInput()) {
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        const { data, error } = await signUp(email, password);
        
        if (error) {
          setError(error);
          return;
        }

        if (!data?.user) {
          setError('Registration failed. Please try again.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        router.refresh();
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('No user email found');
      }

      const response = await supabase.functions.invoke('send-email', {
        body: {
          email: user.email,
          redirectUrl: `${window.location.origin}/auth/callback`,
          userId: user.id
        },
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_EDGE_FUNCTION_PUBLIC_KEY}`
        }
      });

      if (response.error) throw response.error;
      
      setEmailSent(true);
      setError('Verification email sent! Please check your inbox and spam folder.');
    } catch (error) {
      setError('Error sending verification email. Please try again later.');
      console.error('Verification email error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginTab} style={{ width: width - 12 }}>
      {user ? (
        <div className={styles.welcomeMessage}>
          <p>Welcome, {user.email}!</p>
          {!verificationStatus.isVerified && verificationStatus.timeRemaining && (
            <p className={styles.verificationMessage}>
              Time remaining to verify email: {verificationStatus.timeRemaining}
              {!emailSent && (
                <button
                  onClick={sendVerificationEmail}
                  disabled={loading}
                  className={styles.textButton}
                >
                  {loading ? 'Sending...' : 'Resend verification email'}
                </button>
              )}
            </p>
          )}
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              router.refresh();
            }}
            className={styles.submitButton}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <>
          <div className={styles.modeToggle}>
            <button 
              className={!isRegistering ? styles.active : ''} 
              onClick={() => setIsRegistering(false)}
            >
              Login
            </button>
            <button 
              className={isRegistering ? styles.active : ''} 
              onClick={() => setIsRegistering(true)}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit}>
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

            {isRegistering && (
              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.submitButton}>
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default LoginTab;
