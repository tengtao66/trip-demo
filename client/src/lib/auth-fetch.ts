import { useAuthStore } from "@/stores/auth-store";

export async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const user = useAuthStore.getState().user;
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (user) {
    headers.set("X-User-Role", user.role);
    headers.set("X-User-Email", user.email);
  }
  return fetch(url, { ...init, headers });
}
