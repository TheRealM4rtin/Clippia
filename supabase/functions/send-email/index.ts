import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0"
import { SMTPClient } from "https://deno.land/x/smtp/mod.ts"
import { createHash } from "https://deno.land/std/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  email: string
  redirectUrl: string
  userId: string
}

const RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds
const MAX_EMAILS_PER_HOUR = 5;
const rateLimiter = new Map<string, { count: number; timestamp: number }>();

const ALLOWED_DOMAINS = (Deno.env.get('ALLOWED_REDIRECT_DOMAINS') || '').split(',');

serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'No authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const apiKey = authHeader.replace('Bearer ', '');
  if (apiKey !== Deno.env.get('EDGE_FUNCTION_API_KEY')) {
    return new Response(
      JSON.stringify({ error: 'Invalid authorization' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const userLimit = rateLimiter.get(clientIP)

    if (userLimit) {
      if (now - userLimit.timestamp < RATE_LIMIT_WINDOW) {
        if (userLimit.count >= MAX_EMAILS_PER_HOUR) {
          return new Response(
            JSON.stringify({ error: 'Too many requests' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        userLimit.count++
      } else {
        rateLimiter.set(clientIP, { count: 1, timestamp: now })
      }
    } else {
      rateLimiter.set(clientIP, { count: 1, timestamp: now })
    }

    const { email, redirectUrl, userId } = await req.json() as EmailRequest

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    const redirectDomain = new URL(redirectUrl).hostname;
    if (!ALLOWED_DOMAINS.includes(redirectDomain)) {
      throw new Error('Invalid redirect domain');
    }

    const timestamp = Date.now();
    const message = `${email}${timestamp}${userId}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(Deno.env.get('EDGE_FUNCTION_API_KEY')),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(message)
    );
    const token = btoa(String.fromCharCode(...new Uint8Array(signature)));

    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get('SMTP_HOST')!,
        port: parseInt(Deno.env.get('SMTP_PORT')!),
        tls: true,
        auth: {
          username: Deno.env.get('SMTP_USERNAME')!,
          password: Deno.env.get('SMTP_PASSWORD')!,
        },
        timeout: 10000,
      },
    })

    const verificationUrl = `${redirectUrl}?token=${encodeURIComponent(token)}&timestamp=${timestamp}&userId=${userId}`;

    await client.send({
      from: Deno.env.get('SMTP_FROM')!,
      to: email,
      subject: 'Verify your email address',
      content: `
        <html>
          <head>
            <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
            <meta http-equiv="X-Content-Type-Options" content="nosniff">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h1>Verify your email address</h1>
            <p>Click the link below to verify your email address:</p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p>This link will expire in 3 days.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
          </body>
        </html>
      `,
      html: true,
    })

    return new Response(
      JSON.stringify({ message: 'Verification email sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
