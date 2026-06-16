import { NextRequest } from "next/server";
import { bad, getUserOr401, ok } from "../_helpers";

export async function GET() {
  const { error, supabase, user } = await getUserOr401();
  if (error) return error;
  const { data, error: dbErr } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (dbErr) return bad(dbErr.message, 500);
  return ok(data);
}

export async function POST(req: NextRequest) {
  const { error, supabase, user } = await getUserOr401();
  if (error) return error;
  const body = await req.json().catch(() => null);
  if (!body?.name) return bad("name is required");
  const insert = {
    user_id: user.id,
    name: String(body.name).trim(),
    description: body.description || null,
    status: body.status || "active",
    repo_url: body.repo_url || null,
    live_url: body.live_url || null,
  };
  const { data, error: dbErr } = await supabase.from("projects").insert(insert).select().single();
  if (dbErr) return bad(dbErr.message, 500);
  return ok(data, 201);
}
