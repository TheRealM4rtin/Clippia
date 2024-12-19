import { NextResponse } from 'next/server';

class RateLimiter {
  private limits: Map<string, number[]> = new Map();
  
  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.limits.get(key) || [];
    
    // Remove expired timestamps
    const validTimestamps = timestamps.filter(t => now - t < windowMs);
    
    if (validTimestamps.length >= limit) {
      this.limits.set(key, validTimestamps);
      return false;
    }
    
    validTimestamps.push(now);
    this.limits.set(key, validTimestamps);
    return true;
  }
}

const limiter = new RateLimiter();

export async function rateLimit(
  key: string,
  limit: number = 10,
  window: number = 60 // 60 seconds
) {
  const isAllowed = limiter.check(key, limit, window * 1000);
  
  if (!isAllowed) {
    return {
      success: false,
      response: new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }
  
  return { success: true };
}
