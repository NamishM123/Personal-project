import { NextRequest } from "next/server";
import { bad, getUserOr401, ok } from "../../_helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, supabase, user } = await getUserOr401();
  if (error) return error;
  const body = await req.json().catch(() => null);
  if (!body) return bad("missing body");

  const allowed = ["company", "title", "location", "url", "status", "source", "salary", "notes", "applied_at"];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) patch[k] = body[k];

  const { data, error: dbErr } = await supabase
    .from("jobs")
    .update(patch)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (dbErr) return bad(dbErr.message, 500);
  return ok(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error, supabase, user } = await getUserOr401();
  if (error) return error;
  const { error: dbErr } = await supabase.from("jobs").delete().eq("id", params.id).eq("user_id", user.id);
  if (dbErr) return bad(dbErr.message, 500);
  return ok({ ok: true });
}
