import { initDb } from "@/lib/dbInit";
import { NextResponse } from "next/server";

export async function GET() {
  // This route should only be available in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Prevent connection attempt if DATABASE_URL is not set or is a placeholder
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('host:port')) {
    const message = "DATABASE_URL is not set or is a placeholder. Skipping database initialization.";
    console.warn(`⚠️ ${message}`);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }

  const result = await initDb({ drop: false }); // Set drop:true to reset tables

  if (result.success) {
    return NextResponse.json(result, { status: 200 });
  } else {
    return NextResponse.json(result, { status: 500 });
  }
}
