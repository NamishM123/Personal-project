import { NextRequest } from "next/server";
import { bad, getUserOr401, ok } from "../_helpers";

export async function GET() {
  const { error, supabase, user } = await getUserOr401();
  if (error) return error;
  const { data, error: dbErr } = await supabase
    .from("leetcode_problems")
    .select("*")
    .eq("user_id", user.id)
    .order("solved_at", { ascending: false });
  if (dbErr) return bad(dbErr.message, 500);
  return ok(data);
}

export async function POST(req: NextRequest) {
  const { error, supabase, user } = await getUserOr401();
  if (error) return error;
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.slug) return bad("title and slug are required");

  const insert = {
    user_id: user.id,
    slug: String(body.slug).trim(),
    title: String(body.title).trim(),
    difficulty: body.difficulty ?? null,
    topics: body.topics ?? null,
    url: body.url || `https://leetcode.com/problems/${body.slug}/`,
    notes: body.notes || null,
    source: body.source || "manual",
    solved_at: body.solved_at ? new Date(body.solved_at).toISOString() : new Date().toISOString(),
  };
  const { data, error: dbErr } = await supabase.from("leetcode_problems").insert(insert).select().single();
  if (dbErr) return bad(dbErr.message, 500);
  return ok(data, 201);
}
