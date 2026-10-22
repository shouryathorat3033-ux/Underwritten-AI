import { auth } from "@/lib/auth";
import { getPythonBackendUrl } from "@/lib/api-config";

export async function POST(req) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pythonUrl = getPythonBackendUrl();
  const body = await req.json();
  const payload = {
    ...body,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    },
  };

  const endpoint = new URL(
    body.mode === "suggestions" ? "/api/chat/suggestions" : "/api/chat",
    pythonUrl
  );

  try {
    const pyRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const contentType = pyRes.headers.get("Content-Type") || "";

    if (contentType.includes("application/json")) {
      const data = await pyRes.json();
      return Response.json(data);
    }

    return new Response(pyRes.body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch {
    return Response.json(
      { error: "AI service is unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
