export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const LOGIN_ROUTE = "/login";

const looksLikePlaceholder = (value: string) => {
  const v = value.trim();
  if (!v) return true;
  if (v.includes("<") || v.includes(">")) return true;
  if (/your-oauth|your-app-id/i.test(v)) return true;
  return false;
};

export const isOAuthConfigured = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL as string | undefined;
  const appId = import.meta.env.VITE_APP_ID as string | undefined;
  if (!oauthPortalUrl || !appId) return false;
  if (looksLikePlaceholder(oauthPortalUrl) || looksLikePlaceholder(appId)) return false;
  try {
    // Validate URL shape early so the Login button can be disabled.
    new URL(String(oauthPortalUrl));
    return true;
  } catch {
    return false;
  }
};

// Internal route used by the app when unauthenticated.
export const getLoginUrl = () => LOGIN_ROUTE;

// External OAuth portal URL (null when not configured).
export const getOAuthLoginUrl = (): string | null => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL as string | undefined;
  const appId = import.meta.env.VITE_APP_ID as string | undefined;
  if (!oauthPortalUrl || !appId) return null;
  if (looksLikePlaceholder(oauthPortalUrl) || looksLikePlaceholder(appId)) return null;

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${String(oauthPortalUrl).replace(/\/+$/, "")}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
