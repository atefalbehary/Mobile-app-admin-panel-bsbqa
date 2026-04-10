/** Dev: empty → same origin, Vite proxies `/api` → :4000. Prod: set `VITE_API_URL` if API is on another host. */
const BASE = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

export function getToken(): string | null {
  return localStorage.getItem("admin_token");
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem("admin_token", token);
  else localStorage.removeItem("admin_token");
}

export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const headers: HeadersInit = { ...(init?.headers || {}) };
  const token = getToken();
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  if (init?.body && typeof init.body === "string" && !(headers as Record<string, string>)["Content-Type"]) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers,
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (res.status === 401) {
    setToken(null);
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const msg = (data.error as string) || (data.message as string) || res.statusText;
    throw new Error(msg);
  }
  return data as T;
}

export async function uploadFile(file: File, folder = "misc"): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const token = getToken();
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const j = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) throw new Error(j.error || "Upload failed");
  if (!j.url) throw new Error("No URL returned");
  return j.url;
}
