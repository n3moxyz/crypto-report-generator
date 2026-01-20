import { NextRequest, NextResponse } from "next/server";
import { generateWhatsUp } from "@/lib/openai";
import { getCachedWhatsUp, setCachedWhatsUp, getCacheAge } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResult = checkRateLimit(request);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          ),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimitResult.resetTime),
        },
      }
    );
  }

  try {
    // Check if refresh is requested
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";

    // Check for cached data first (unless refresh is forced)
    if (!forceRefresh) {
      const cached = await getCachedWhatsUp();

      if (cached) {
        return NextResponse.json({
          ...cached.data,
          timestamp: cached.timestamp,
          cached: true,
          cacheAge: getCacheAge(cached),
        });
      }
    }

    // No valid cache, generate fresh data
    const data = await generateWhatsUp();

    // Cache the result
    await setCachedWhatsUp(data);

    return NextResponse.json({
      ...data,
      timestamp: new Date().toISOString(),
      cached: false,
    });
  } catch (error) {
    console.error("Error generating WhatsUp:", error);
    return NextResponse.json(
      { error: "Failed to generate market summary" },
      { status: 500 }
    );
  }
}
