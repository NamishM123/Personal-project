import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function getUserOr401() {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), supabase: null, user: null } as const;
  }
  return { error: null, supabase, user: data.user } as const;
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
