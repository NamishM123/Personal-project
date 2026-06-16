/**
 * Gmail API wrapper. No SDK; just fetch against Google's REST endpoints.
 *
 * Token lifecycle:
 *   - User OAuths once. We store access_token, refresh_token, expires_at.
 *   - Before every API call, `getValidAccessToken` refreshes if expired.
 *   - The refresh_token doesn't expire (until the user revokes).
 */

import { getSupabaseAdmin } from "@/lib/supabase/server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

export function buildAuthUrl(opts: { redirectUri: string; state: string }) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: GMAIL_SCOPES,
    access_type: "offline",
    prompt: "consent", // force refresh_token to be returned
    state: opts.state,
    include_granted_scopes: "true",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Token exchange failed: ${res.status} ${t}`);
  }
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    token_type: string;
    id_token?: string;
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Token refresh failed: ${res.status} ${t}`);
  }
  return (await res.json()) as {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
  };
}

/**
 * Returns a usable access_token for the given user, refreshing if needed.
 * Throws if the user hasn't connected Gmail.
 */
export async function getValidAccessToken(userId: string): Promise<{
  accessToken: string;
  email: string;
}> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("gmail_connections")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("Gmail not connected");

  const expiresAt = new Date(data.expires_at).getTime();
  // 60s safety margin
  if (Date.now() < expiresAt - 60_000) {
    return { accessToken: data.access_token, email: data.email };
  }

  const refreshed = await refreshAccessToken(data.refresh_token);
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  await admin
    .from("gmail_connections")
    .update({
      access_token: refreshed.access_token,
      expires_at: newExpiresAt,
    })
    .eq("user_id", userId);
  return { accessToken: refreshed.access_token, email: data.email };
}

export async function getUserEmail(accessToken: string): Promise<string> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`userinfo failed: ${res.status}`);
  const json = (await res.json()) as { email: string };
  return json.email;
}

export type GmailMessageListItem = { id: string; threadId: string };

export async function listMessages(
  accessToken: string,
  query: string,
  maxResults = 50
): Promise<GmailMessageListItem[]> {
  const url = new URL(`${GMAIL_BASE}/messages`);
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(maxResults));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`listMessages failed: ${res.status}`);
  const json = (await res.json()) as { messages?: GmailMessageListItem[] };
  return json.messages ?? [];
}

export type GmailMessage = {
  id: string;
  internalDate: string; // unix ms as string
  payload: {
    headers: { name: string; value: string }[];
    parts?: GmailPart[];
    body?: { data?: string };
    mimeType?: string;
  };
  snippet?: string;
};
type GmailPart = {
  mimeType: string;
  body?: { data?: string };
  parts?: GmailPart[];
};

export async function getMessage(accessToken: string, id: string): Promise<GmailMessage> {
  const url = new URL(`${GMAIL_BASE}/messages/${id}`);
  url.searchParams.set("format", "full");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`getMessage failed: ${res.status}`);
  return (await res.json()) as GmailMessage;
}

/** Decode base64url payload data (Gmail uses URL-safe base64). */
function decodeB64(data: string): string {
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof atob === "function") {
    try {
      return decodeURIComponent(
        atob(b64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    } catch {
      return atob(b64);
    }
  }
  return Buffer.from(b64, "base64").toString("utf-8");
}

export function extractBodyText(msg: GmailMessage): string {
  const out: string[] = [];
  function walk(part: { mimeType?: string; body?: { data?: string }; parts?: GmailPart[] }) {
    if (part.body?.data && (part.mimeType === "text/plain" || part.mimeType === "text/html")) {
      const decoded = decodeB64(part.body.data);
      out.push(part.mimeType === "text/html" ? stripHtml(decoded) : decoded);
    }
    part.parts?.forEach(walk);
  }
  walk(msg.payload);
  return out.join("\n");
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function getHeader(msg: GmailMessage, name: string): string {
  const h = msg.payload.headers.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value ?? "";
}
