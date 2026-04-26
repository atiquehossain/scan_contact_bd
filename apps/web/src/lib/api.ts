export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "ScanContact BD";

export function authToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("accessToken") || "";
}

export function saveAuth(tokens: { accessToken: string; refreshToken: string }) {
  window.localStorage.setItem("accessToken", tokens.accessToken);
  window.localStorage.setItem("refreshToken", tokens.refreshToken);
}

export function refreshToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("refreshToken") || "";
}

export function clearAuth() {
  window.localStorage.removeItem("accessToken");
  window.localStorage.removeItem("refreshToken");
}

export async function apiFetch<T>(path: string, options: RequestInit = {}, token = authToken()): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    cache: "no-store"
  });
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  const data = text ? (contentType.includes("application/json") ? JSON.parse(text) : { error: text }) : {};
  if (!response.ok) {
    throw new Error(data.message || data.error || "Request failed");
  }
  return data as T;
}

export function qrImageUrl(publicSlug: string, format: "png" | "svg" = "png") {
  return `${API_BASE}/qr/${publicSlug}.${format}`;
}

export function adminQrDownloadUrl(tagId: string, format: "png" | "svg" = "png") {
  return `${API_BASE}/tags/${tagId}/download-qr?format=${format}`;
}
