'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function CheckoutSuccess() {
  const [status, setStatus] = useState('verifying');
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    let retryCount = 0;
    const MAX_RETRIES = 10;
    let timeoutId: NodeJS.Timeout;
    let redirectTimeoutId: NodeJS.Timeout;

    async function verifyPurchase() {
      try {
        console.log('🔍 Verifying purchase attempt:', retryCount + 1);

        // First, check all recent attempts
        const { data: allAttempts, error: attemptsError } = await supabase
          .from('checkout_attempts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        console.log('Recent checkout attempts:', {
          attempts: allAttempts,
          error: attemptsError?.message
        });

        // Then check for completed ones
        const { data: checkoutData, error: checkoutError } = await supabase
          .from('checkout_attempts')
          .select('*')
          .eq('completed', true)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        console.log('📝 Checkout verification:', {
          checkoutData,
          error: checkoutError?.message,
          retryCount
        });

        if (checkoutData) {
          console.log('✅ Purchase verified successfully:', checkoutData);
          setStatus('success');
          
          // Use window.location for redirection
          console.log('🔄 Redirecting to home page in 2 seconds...');
          redirectTimeoutId = setTimeout(() => {
            console.log('🏠 Redirecting now...');
            window.location.href = '/';
          }, 2000);
        } else {
          console.log('⏳ Purchase pending, will retry');
          setStatus('pending');
          
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            timeoutId = setTimeout(verifyPurchase, 3000);
          } else {
            console.log('❌ Max retries reached, showing error');
            setStatus('error');
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error('❌ Verification error:', {
            message: error.message,
            stack: error.stack,
            retryCount
          });
        } else {
          console.error('❌ Unknown verification error:', error);
        }
        
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          timeoutId = setTimeout(verifyPurchase, 3000);
        } else {
          setStatus('error');
        }
      }
    }

    // Initial delay before first verification attempt
    console.log('⏳ Waiting for webhook to process...');
    timeoutId = setTimeout(verifyPurchase, 5000);

    // Cleanup function
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (redirectTimeoutId) clearTimeout(redirectTimeoutId);
      retryCount = MAX_RETRIES;
    };
  }, [router, supabase]);

  // Handle manual redirect
  const handleManualRedirect = () => {
    console.log('🏠 Manual redirect triggered');
    window.location.href = '/';
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {status === 'verifying' && (
          <>
            <h1 className="text-2xl font-bold mb-4">Verifying your purchase...</h1>
            <p className="text-gray-600">This may take a few moments</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold mb-4">Thank you for your purchase!</h1>
            <p className="text-gray-600 mb-4">Redirecting you back...</p>
            <button 
              onClick={handleManualRedirect}
              className="text-blue-500 hover:text-blue-700 underline"
            >
              Click here if not redirected automatically
            </button>
          </>
        )}
        {status === 'pending' && (
          <>
            <h1 className="text-2xl font-bold mb-4">Payment received!</h1>
            <p className="text-gray-600">Processing your purchase...</p>
          </>
        )}
        {status === 'error' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">There was an error verifying your purchase</h1>
            <p className="mb-4 text-gray-600">Please contact support if this issue persists.</p>
            <button 
              onClick={handleManualRedirect}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}