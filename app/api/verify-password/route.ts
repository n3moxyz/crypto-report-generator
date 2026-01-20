import { NextRequest, NextResponse } from "next/server";

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
    const correctPassword = type === "whatsup"
      ? process.env.WHATSUP_PASSWORD
      : process.env.REPORT_PASSWORD;

    if (!correctPassword) {
      // If no password is configured, allow access
      return NextResponse.json({ success: true });
    }

    if (password === correctPassword) {
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
