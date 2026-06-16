import { NextRequest } from "next/server";
import { bad, getUserOr401, ok } from "@/app/api/_helpers";
import { getValidAccessToken, listMessages, getMessage } from "@/lib/gmail";
import { buildSearchQuery, looksLikeApplicationEmail, parseApplicationEmail } from "@/lib/gmail-parser";

/**
 * POST /api/gmail/sync
 *   body: { days?: number, limit?: number }
 *
 * Fetches recent application-confirmation emails, parses them, and
 * inserts new jobs. Deduplicated via the gmail_imported_messages table
 * (message id → job row), so re-running is safe and idempotent.
 */
export async function POST(req: NextRequest) {
  const { error, supabase, user } = await getUserOr401();
  if (error) return error;

  const body = await req.json().catch(() => ({} as any));
  const days = Math.min(Math.max(Number(body?.days) || 60, 1), 365);
  const limit = Math.min(Math.max(Number(body?.limit) || 50, 1), 100);

  let accessToken: string;
  try {
    const { accessToken: t } = await getValidAccessToken(user.id);
    accessToken = t;
  } catch (e) {
    return bad((e as Error).message, 400);
  }

  const result = {
    scanned: 0,
    matched: 0,
    inserted: 0,
    duplicates: 0,
    skipped: 0,
    errors: [] as string[],
  };

  let messages;
  try {
    messages = await listMessages(accessToken, buildSearchQuery(days), limit);
  } catch (e) {
    return bad(`Gmail list failed: ${(e as Error).message}`, 502);
  }
  result.scanned = messages.length;

  if (messages.length === 0) {
    await supabase
      .from("gmail_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", user.id);
    return ok(result);
  }

  // Check which message IDs we've already imported (skip the API call for those).
  const { data: already } = await supabase
    .from("gmail_imported_messages")
    .select("message_id")
    .eq("user_id", user.id)
    .in(
      "message_id",
      messages.map((m) => m.id)
    );
  const seen = new Set((already ?? []).map((r) => r.message_id));

  for (const m of messages) {
    if (seen.has(m.id)) {
      result.duplicates++;
      continue;
    }
    try {
      const full = await getMessage(accessToken, m.id);
      if (!looksLikeApplicationEmail(full)) {
        result.skipped++;
        continue;
      }
      const parsed = parseApplicationEmail(full);
      if (!parsed || !parsed.company || !parsed.title) {
        // Mark as seen anyway so we don't retry every sync.
        await supabase.from("gmail_imported_messages").insert({
          user_id: user.id,
          message_id: m.id,
          job_id: null,
        });
        result.skipped++;
        continue;
      }
      result.matched++;

      const appliedAt = new Date(Number(full.internalDate || Date.now())).toISOString();

      const { data: inserted, error: insErr } = await supabase
        .from("jobs")
        .insert({
          user_id: user.id,
          company: parsed.company,
          title: parsed.title,
          url: parsed.url,
          source: parsed.source,
          status: "applied",
          applied_at: appliedAt,
          notes: "Imported from Gmail.",
        })
        .select()
        .single();
      if (insErr) {
        result.errors.push(`${m.id}: ${insErr.message}`);
        continue;
      }
      await supabase.from("gmail_imported_messages").insert({
        user_id: user.id,
        message_id: m.id,
        job_id: inserted.id,
      });
      result.inserted++;
    } catch (e) {
      result.errors.push(`${m.id}: ${(e as Error).message}`);
    }
  }

  await supabase
    .from("gmail_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("user_id", user.id);

  return ok(result);
}
