import { bad, getUserOr401, ok } from "@/app/api/_helpers";

export async function POST() {
  const { error, supabase, user } = await getUserOr401();
  if (error) return error;
  const { error: dbErr } = await supabase
    .from("gmail_connections")
    .delete()
    .eq("user_id", user.id);
  if (dbErr) return bad(dbErr.message, 500);
  return ok({ ok: true });
}
