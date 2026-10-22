import { NextResponse } from "next/server";

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const res = await fetch(`${PYTHON_URL}/api/reasoning/status`, {
      method: "GET",
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({
        available: false,
        connected: false,
        error: `Backend returned ${res.status}`,
      });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      available: false,
      connected: false,
      error: error.message || "Failed to reach reasoning service",
    });
  }
}
