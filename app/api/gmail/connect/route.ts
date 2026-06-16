import { NextRequest, NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/gmail";
import { bad, getUserOr401 } from "@/app/api/_helpers";

/**
 * Kick off the Google OAuth flow. We bounce the user to Google's
 * consent screen; Google redirects back to /api/gmail/callback with
 * a code we can exchange for tokens.
 */
export async function GET(req: NextRequest) {
  const { error, user } = await getUserOr401();
  if (error) return error;
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return bad("Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in env.", 500);
  }

  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/gmail/callback`;
  const state = `${user.id}.${crypto.randomUUID()}`;

  const url = buildAuthUrl({ redirectUri, state });

  const res = NextResponse.redirect(url);
  // Store state in a short-lived httpOnly cookie so we can validate
  // the callback came from this same browser session.
  res.cookies.set("gmail_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
