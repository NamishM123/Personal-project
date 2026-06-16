/**
 * One-shot LeetCode sync runnable outside the Next.js app.
 *
 *   pnpm sync:leetcode <user-uuid> [username]
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in env. The user UUID is the auth.users.id
 * of the account that should own the imported problems (find it in Supabase
 * dashboard → Authentication → Users).
 */
import { createClient } from "@supabase/supabase-js";
import { fetchProblemMeta, fetchRecentAccepted } from "../lib/leetcode";

const userId = process.argv[2];
const username = process.argv[3] ?? process.env.LEETCODE_USERNAME;

if (!userId || !username) {
  console.error("usage: tsx scripts/sync-leetcode.ts <user-uuid> [username]");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const recent = await fetchRecentAccepted(username!, 50);
  console.log(`Fetched ${recent.length} recent submissions for ${username}.`);
  let inserted = 0;
  const metaCache = new Map<string, { difficulty: "Easy" | "Medium" | "Hard"; topics: string[] }>();

  for (const sub of recent) {
    let meta = metaCache.get(sub.titleSlug);
    if (!meta) {
      const fetched = await fetchProblemMeta(sub.titleSlug);
      if (fetched) {
        meta = fetched;
        metaCache.set(sub.titleSlug, fetched);
      }
    }
    const solvedAt = new Date(Number(sub.timestamp) * 1000).toISOString();
    const { error } = await supabase.from("leetcode_problems").upsert(
      {
        user_id: userId,
        slug: sub.titleSlug,
        title: sub.title,
        difficulty: meta?.difficulty ?? null,
        topics: meta?.topics ?? null,
        url: `https://leetcode.com/problems/${sub.titleSlug}/`,
        solved_at: solvedAt,
        source: "sync",
      },
      { onConflict: "user_id,slug,solved_at", ignoreDuplicates: true }
    );
    if (!error) inserted++;
    else console.error("skip", sub.titleSlug, error.message);
  }
  console.log(`Inserted ${inserted} new problems.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
