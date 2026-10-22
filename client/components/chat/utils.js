export function getPageLabel(pathname) {
  if (!pathname) return "Home";
  // Normalize: strip /applicant or /admin prefix for matching
  const normalized = pathname.replace(/^\/(applicant|admin)/, "");
  const map = {
    "/dashboard": "Dashboard",
    "/assess": "New Assessment",
    "/dashboard/history": "History",
    "/dashboard/analytics": "Analytics",
    "/dashboard/profile": "My Profile",
    "/dashboard/assess": "New Assessment",
    "/dashboard/policies": "Policies",
    "/dashboard/fairness": "ML Fairness",
    "/dashboard/weights": "Risk Weights",
  };
  if (map[normalized]) return map[normalized];
  if (normalized.includes("/assessment/")) return "Assessment Details";
  return "Dashboard";
}

export async function fetchSuggestions(pathname) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "suggestions", page: pathname }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.suggestions || [];
  } catch {
    return [];
  }
}

export async function sendMessage(message, pathname, history, onToken) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, page: pathname, history }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to send message");
  }

  const contentType = res.headers.get("Content-Type") || "";

  if (contentType.includes("application/json")) {
    const data = await res.json();
    return { type: "action", data };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = reader.read ? await reader.read() : { done: true };
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onToken(full);
  }
  return { type: "stream", content: full };
}

export function loadChat() {
  try {
    return JSON.parse(sessionStorage.getItem("app_chat") || "[]");
  } catch {
    return [];
  }
}

export function saveChat(msgs) {
  try {
    const clean = msgs
      .filter((m) => m.content && m.content.trim())
      .slice(-10);
    sessionStorage.setItem("app_chat", JSON.stringify(clean));
  } catch {}
}
