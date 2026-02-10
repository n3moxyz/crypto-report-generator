import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

// Constant-time string comparison to prevent timing attacks
function secureCompare(a: string, b: string): boolean {
  // Convert strings to buffers of equal length
  const bufA = Buffer.from(a.padEnd(256, '\0'));
  const bufB = Buffer.from(b.padEnd(256, '\0'));

  // timingSafeEqual requires equal length buffers
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, type } = body as { password: string; type?: string };

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Select the correct password based on type
    let correctPassword: string | undefined;
    if (type === "whatsup") {
      correctPassword = process.env.WHATSUP_PASSWORD;
    } else if (type === "archive") {
      correctPassword = process.env.ARCHIVE_PASSWORD;
    } else {
      correctPassword = process.env.REPORT_PASSWORD;
    }

    if (!correctPassword) {
      // If no password is configured, allow access
      return NextResponse.json({ success: true });
    }

    // Use timing-safe comparison to prevent timing attacks
    if (secureCompare(password, correctPassword)) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
