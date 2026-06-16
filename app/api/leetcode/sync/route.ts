import { NextRequest } from "next/server";
import { fetchProblemMeta, fetchRecentAccepted } from "@/lib/leetcode";
import { bad, getUserOr401, ok } from "../../_helpers";

/**
 * POST /api/leetcode/sync
 *   body: { username?: string, limit?: number }
 *
 * Fetches the user's recent accepted submissions from LeetCode and upserts
 * them into the `leetcode_problems` table. The unique (user_id, slug, solved_at)
 * constraint dedupes naturally.
 */
export async function POST(req: NextRequest) {
  const { error, supabase, user } = await getUserOr401();
  if (error) return error;

  const body = await req.json().catch(() => ({} as any));
  const username = (body?.username as string | undefined) || process.env.LEETCODE_USERNAME;
  if (!username) return bad("Pass a username or set LEETCODE_USERNAME env var");
  const limit = Math.min(Math.max(Number(body?.limit) || 30, 1), 100);

  let recent;
  try {
    recent = await fetchRecentAccepted(username, limit);
  } catch (e) {
    return bad(`LeetCode fetch failed: ${(e as Error).message}`, 502);
  }

  const result = { fetched: recent.length, inserted: 0, skipped: 0, errors: [] as string[] };
  const metaCache = new Map<string, { difficulty: "Easy" | "Medium" | "Hard"; topics: string[] }>();

  for (const sub of recent) {
    try {
      let meta = metaCache.get(sub.titleSlug);
      if (!meta) {
        const fetched = await fetchProblemMeta(sub.titleSlug);
        if (fetched) {
          meta = fetched;
          metaCache.set(sub.titleSlug, fetched);
        }
      }
      const solvedAt = new Date(Number(sub.timestamp) * 1000).toISOString();
      const { error: dbErr } = await supabase
        .from("leetcode_problems")
        .upsert(
          {
            user_id: user.id,
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
      if (dbErr) {
        result.errors.push(`${sub.titleSlug}: ${dbErr.message}`);
        result.skipped++;
      } else {
        result.inserted++;
      }
    } catch (e) {
      result.errors.push(`${sub.titleSlug}: ${(e as Error).message}`);
    }
  }
  return ok(result);
}
