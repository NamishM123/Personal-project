import { NextRequest } from "next/server";
import { bad, getUserOr401, ok } from "../../_helpers";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error, supabase, user } = await getUserOr401();
  if (error) return error;
  const { error: dbErr } = await supabase
    .from("leetcode_problems")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);
  if (dbErr) return bad(dbErr.message, 500);
  return ok({ ok: true });
}
