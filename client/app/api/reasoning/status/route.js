import { NextResponse } from "next/server";
import { getPythonBackendUrl } from "@/lib/api-config";

export async function GET() {
  try {
    const pythonUrl = getPythonBackendUrl();
    const res = await fetch(new URL("/api/reasoning/status", pythonUrl), {
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
