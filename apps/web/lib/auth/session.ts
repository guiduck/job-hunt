import { cookies } from "next/headers";
import { getAppConfig } from "@/lib/config";

export const freelanceAuthCookieName = "freelance_auth_token";

export type FreelanceAuthUser = {
  id: string;
  email: string;
  display_name: string;
};

type AuthSessionPayload = {
  access_token: string;
  user: FreelanceAuthUser;
};

function authApiUrl(path: string) {
  return `${getAppConfig().authApiBaseUrl.replace(/\/$/, "")}${path}`;
}

export async function getFreelanceAuthToken() {
  return (await cookies()).get(freelanceAuthCookieName)?.value ?? null;
}

export async function getFreelanceCurrentUser() {
  const token = await getFreelanceAuthToken();
  if (!token) {
    return null;
  }

  const response = await fetch(authApiUrl("/auth/me"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as FreelanceAuthUser;
}

export async function buildGoogleAuthStartUrl() {
  const callbackUrl = `${getAppConfig().webAppBaseUrl.replace(/\/$/, "")}/auth/google/callback`;
  const params = new URLSearchParams({ success_redirect_url: callbackUrl });
  const response = await fetch(authApiUrl(`/auth/google/start?${params.toString()}`), {
    cache: "no-store"
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Unable to start Google sign-in. HTTP ${response.status}`);
  }
  const body = (await response.json()) as { auth_url: string };
  return body.auth_url;
}

export async function setFreelanceAuthSession(payload: AuthSessionPayload) {
  const response = await fetch(authApiUrl("/auth/me"), {
    headers: { Authorization: `Bearer ${payload.access_token}` },
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error("Google sign-in returned an invalid app session.");
  }
  const user = (await response.json()) as FreelanceAuthUser;
  const cookieStore = await cookies();
  cookieStore.set(freelanceAuthCookieName, payload.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return user;
}

export async function clearFreelanceAuthSession() {
  const token = await getFreelanceAuthToken();
  if (token) {
    await fetch(authApiUrl("/auth/logout"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    }).catch(() => undefined);
  }
  (await cookies()).delete(freelanceAuthCookieName);
}
