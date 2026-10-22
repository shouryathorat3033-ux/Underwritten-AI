import { NextResponse } from "next/server";
import { getPythonBackendUrl } from "@/lib/api-config";

async function proxy(req, { params }) {
  const pythonUrl = getPythonBackendUrl();
  const { path } = await params;
  const subpath = Array.isArray(path) ? path.join("/") : path;
  const search = req.nextUrl.search || "";
  const targetUrl = new URL(`/api/rag/${subpath}${search}`, pythonUrl);

  try {
    const init = {
      method: req.method,
      headers: {
        "Content-Type": req.headers.get("content-type") || "application/json",
      },
      signal: AbortSignal.timeout(30000),
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const body = await req.text();
      if (body) init.body = body;
    }

    const res = await fetch(targetUrl, init);
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }
    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: `RAG service proxy failure: ${err.message}` },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
