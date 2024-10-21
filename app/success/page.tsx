'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // You can add any additional logic here, such as:
    // - Verifying the payment status with your backend
    // - Updating the user's subscription status in your database
    // - Displaying a personalized message or order details

    // Redirect to the dashboard or home page after a few seconds
    const redirectTimer = setTimeout(() => {
      router.push('/dashboard');
    }, 5000);

    return () => clearTimeout(redirectTimer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4 text-green-600">Payment Successful!</h1>
      <p className="text-xl mb-8">Thank you for your purchase.</p>
      <p>You will be redirected to your dashboard shortly...</p>
    </div>
  );
}
