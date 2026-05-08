export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "ScanContact BD";

const isClient = typeof window !== "undefined";

function shouldDebug() {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEBUG_LOGS === "true";
}

function redactPath(path: string) {
  return path.replace(/([?&]token=)[^&]+/gi, "$1[redacted]");
}

function bodySummary(body: BodyInit | null | undefined) {
  if (!body) return "none";
  if (typeof body !== "string") return typeof body;
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    return `keys=[${Object.keys(parsed).join(",")}]`;
  } catch {
    return "string";
  }
}

export function clientDebugLog(area: string, fields: Record<string, unknown> = {}) {
  if (!shouldDebug() || !isClient) return;
  const details = Object.entries(fields)
    .map(([key, value]) => {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return `${key}=${value}`;
      return `${key}=${JSON.stringify(value)}`;
    })
    .join(" ");
  console.info(`[ScanContact Web] ${area}${details ? ` ${details}` : ""}`);
}

function responseErrorMessage(data: Record<string, unknown>) {
  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;
  return "Request failed";
}

export function authToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("accessToken") || "";
}

export function saveAuth(tokens: { accessToken: string; refreshToken: string }) {
  clientDebugLog("auth.saveTokens", { accessTokenPresent: Boolean(tokens.accessToken), refreshTokenPresent: Boolean(tokens.refreshToken) });
  window.localStorage.setItem("accessToken", tokens.accessToken);
  window.localStorage.setItem("refreshToken", tokens.refreshToken);
}

export function refreshToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("refreshToken") || "";
}

export function clearAuth() {
  clientDebugLog("auth.clearTokens");
  window.localStorage.removeItem("accessToken");
  window.localStorage.removeItem("refreshToken");
}

export async function apiFetch<T>(path: string, options: RequestInit = {}, token = authToken()): Promise<T> {
  const startedAt = performance.now();
  clientDebugLog("api.request", {
    method: options.method || "GET",
    path: redactPath(path),
    auth: Boolean(token),
    body: bodySummary(options.body)
  });
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    cache: "no-store"
  });
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  let data: Record<string, unknown> = {};
  try {
    data = text ? (contentType.includes("application/json") ? JSON.parse(text) : { error: text }) : {};
  } catch (error) {
    clientDebugLog("api.parseError", {
      method: options.method || "GET",
      path: redactPath(path),
      status: response.status,
      error: error instanceof Error ? error.message : "unknown"
    });
    data = { error: "Invalid server response" };
  }
  clientDebugLog(response.ok ? "api.response" : "api.errorResponse", {
    method: options.method || "GET",
    path: redactPath(path),
    status: response.status,
    ms: Math.round(performance.now() - startedAt),
    responseKeys: Object.keys(data).join(",")
  });
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/admin-login" && typeof window !== "undefined") {
      clearAuth();
      if (window.location.pathname.startsWith("/admin") && window.location.pathname !== "/admin/login") {
        window.location.replace("/admin/login");
      }
    }
    throw new Error(responseErrorMessage(data));
  }
  return data as T;
}

export function qrImageUrl(publicSlug: string, format: "png" | "svg" = "png") {
  return `${API_BASE}/qr/${publicSlug}.${format}`;
}

export function adminQrDownloadUrl(tagId: string, format: "png" | "svg" = "png") {
  return `${API_BASE}/tags/${tagId}/download-qr?format=${format}`;
}
