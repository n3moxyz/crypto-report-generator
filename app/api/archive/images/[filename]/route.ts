import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { timingSafeEqual } from "crypto";

function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a.padEnd(256, '\0'));
  const bufB = Buffer.from(b.padEnd(256, '\0'));
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  // Require password if ARCHIVE_PASSWORD is set
  const archivePassword = process.env.ARCHIVE_PASSWORD;
  if (archivePassword) {
    const authHeader = request.headers.get("x-archive-password") || "";
    if (!secureCompare(authHeader, archivePassword)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { filename } = await params;

  // Validate filename: only alphanumeric, dots, and must end in .png
  if (!/^[a-zA-Z0-9.]+\.png$/.test(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "samples", filename);

  try {
    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
