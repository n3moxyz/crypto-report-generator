import { NextRequest } from "next/server";

const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 10;

// In-memory store for rate limiting
// Note: This resets on serverless function cold starts, which is acceptable
// for basic protection. For production, consider using Redis or Vercel KV.
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIP(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, the first one is the client
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Vercel-specific header
  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(",")[0].trim();
  }

  // Fallback
  return "unknown";
}

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  isAdmin: boolean;
}

export function checkRateLimit(request: NextRequest): RateLimitResult {
  // Check for admin bypass token
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const adminBypassToken = process.env.ADMIN_BYPASS_TOKEN;

  if (adminBypassToken && token === adminBypassToken) {
    return {
      allowed: true,
      remaining: MAX_REQUESTS,
      resetTime: Date.now() + WINDOW_MS,
      isAdmin: true,
    };
  }

  // Periodically cleanup expired entries (every ~10 requests)
  if (Math.random() < 0.1) {
    cleanupExpiredEntries();
  }

  const clientIP = getClientIP(request);
  const now = Date.now();

  const existing = rateLimitStore.get(clientIP);

  if (!existing || now > existing.resetTime) {
    // First request or window expired - start fresh
    const resetTime = now + WINDOW_MS;
    rateLimitStore.set(clientIP, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetTime,
      isAdmin: false,
    };
  }

  // Within existing window
  if (existing.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: existing.resetTime,
      isAdmin: false,
    };
  }

  // Increment count
  existing.count += 1;
  rateLimitStore.set(clientIP, existing);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - existing.count,
    resetTime: existing.resetTime,
    isAdmin: false,
  };
}
