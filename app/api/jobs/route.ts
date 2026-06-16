import { NextRequest } from "next/server";
import { bad, getUserOr401, ok } from "../_helpers";

export async function GET() {
  const { error, supabase, user } = await getUserOr401();
  if (error) return error;
  const { data, error: dbErr } = await supabase
    .from("jobs")
    .select("*")
    .eq("user_id", user.id)
    .order("applied_at", { ascending: false });
  if (dbErr) return bad(dbErr.message, 500);
  return ok(data);
}

export async function POST(req: NextRequest) {
  const { error, supabase, user } = await getUserOr401();
  if (error) return error;
  const body = await req.json().catch(() => null);
  if (!body?.company || !body?.title) return bad("company and title are required");

  const insert = {
    user_id: user.id,
    company: String(body.company).trim(),
    title: String(body.title).trim(),
    location: body.location || null,
    url: body.url || null,
    status: body.status || "applied",
    source: body.source || null,
    salary: body.salary || null,
    notes: body.notes || null,
    applied_at: body.applied_at ? new Date(body.applied_at).toISOString() : new Date().toISOString(),
  };
  const { data, error: dbErr } = await supabase.from("jobs").insert(insert).select().single();
  if (dbErr) return bad(dbErr.message, 500);
  return ok(data, 201);
}
