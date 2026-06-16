import { NextRequest } from "next/server";
import { bad, getUserOr401, ok } from "../_helpers";

export async function GET() {
  const { error, supabase, user } = await getUserOr401();
  if (error) return error;
  const { data, error: dbErr } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("day", { ascending: false });
  if (dbErr) return bad(dbErr.message, 500);
  return ok(data);
}

/**
 * POST upserts on (user_id, day) — one log per day. Resending the form
 * for the same day overwrites.
 */
export async function POST(req: NextRequest) {
  const { error, supabase, user } = await getUserOr401();
  if (error) return error;
  const body = await req.json().catch(() => null);
  if (!body?.day) return bad("day is required");

  const payload = {
    user_id: user.id,
    day: body.day,
    summary: body.summary || null,
    highlights: body.highlights || null,
    hours_focused: typeof body.hours_focused === "number" ? body.hours_focused : null,
    mood: typeof body.mood === "number" ? body.mood : null,
  };
  const { data, error: dbErr } = await supabase
    .from("daily_logs")
    .upsert(payload, { onConflict: "user_id,day" })
    .select()
    .single();
  if (dbErr) return bad(dbErr.message, 500);
  return ok(data, 201);
}
