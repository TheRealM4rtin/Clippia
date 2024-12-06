import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client (you'll need to add UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN to your env variables)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_TOKEN || '',
});

export async function rateLimit(
  ip: string,
  limit: number = 10,
  window: number = 60, // 60 seconds
  prefix: string = 'rate-limit'
) {
  const key = `${prefix}:${ip}`;
  
  try {
    const requests = await redis.incr(key);
    
    if (requests === 1) {
      await redis.expire(key, window);
    }
    
    if (requests > limit) {
      return {
        success: false,
        response: new NextResponse(
          JSON.stringify({ error: 'Too many requests' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open - allow the request if rate limiting fails
    return { success: true };
  }
}
