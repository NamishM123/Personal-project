"use client";

import { createBrowserClient } from "@supabase/ssr";

type Client = ReturnType<typeof createBrowserClient>;
let cached: Client | null = null;

export function getSupabaseBrowser(): Client {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Set them in your Vercel project env vars."
    );
  }
  cached = createBrowserClient(url, anon);
  return cached;
}
