'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../style/LoginWindow.module.css';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const emailSchema = z.string().email('Invalid email address');

interface LoginTabProps {
  width: number;
}


const LoginContent: React.FC<LoginTabProps> = ({ width }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

  const { user } = useAuth();

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
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });

        if (signUpError) {
          if (signUpError.message.toLowerCase().includes('email already registered')) {
            setError('An account with this email already exists. Please log in instead.');
          } else {
            setError(signUpError.message);
          }
          return;
        }

        setError('Please check your email to verify your account.');
        clearForm();
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        clearForm();
        router.refresh();
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setIsRegistering(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearForm();
    router.refresh();
  };

  return (
    <div className={styles.loginTab} style={{ width: width - 12 }}>
      {user ? (
        <div className={styles.welcomeMessage}>
          <p>Welcome, {user.email}!</p>
          <button 
            onClick={handleSignOut}
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

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Loading...' : (isRegistering ? 'Register' : 'Login')}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default LoginContent;
