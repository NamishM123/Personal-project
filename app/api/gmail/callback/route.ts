import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getUserEmail } from "@/lib/gmail";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Google sends the user back here after they grant access. We exchange
 * the auth code for tokens and persist them in `gmail_connections`
 * keyed by the signed-in user's UUID.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const back = (status: "ok" | "error", reason?: string) => {
    const dest = new URL("/settings", url.origin);
    dest.searchParams.set("gmail", status);
    if (reason) dest.searchParams.set("reason", reason);
    return NextResponse.redirect(dest);
  };

  if (error) return back("error", error);
  if (!code || !state) return back("error", "missing_code");

  const cookieState = req.cookies.get("gmail_oauth_state")?.value;
  if (!cookieState || cookieState !== state) return back("error", "state_mismatch");

  const supabase = getSupabaseServer();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return back("error", "not_signed_in");

  // state has the form `<userId>.<nonce>` — confirm it matches the session.
  const [stateUserId] = state.split(".");
  if (stateUserId !== u.user.id) return back("error", "user_mismatch");

  const redirectUri = `${url.origin}/api/gmail/callback`;

  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    if (!tokens.refresh_token) {
      // Without a refresh token we can't sync later. Tell the user to
      // disconnect at https://myaccount.google.com/permissions and try again.
      return back("error", "no_refresh_token");
    }
    const email = await getUserEmail(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error: dbErr } = await supabase
      .from("gmail_connections")
      .upsert({
        user_id: u.user.id,
        email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
      });
    if (dbErr) return back("error", dbErr.message);

    const res = back("ok");
    res.cookies.set("gmail_oauth_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    return back("error", (e as Error).message);
  }
}
