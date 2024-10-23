/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production'
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.stripe.com https://api.stripe.com https://r.stripe.com; frame-src https://*.stripe.com; img-src 'self' https://*.stripe.com data:;"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.stripe.com https://api.stripe.com https://r.stripe.com; frame-src https://*.stripe.com; img-src 'self' https://*.stripe.com data:;"
          },
          // Note: r.stripe.com is included for Stripe's fraud prevention and analytics.
          // Some users' ad blockers may still block this, but it shouldn't affect core payment functionality.
        ],
      },
    ]
  },
}

export default nextConfig;
