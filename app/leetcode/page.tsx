import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { LeetcodeSyncButton } from "@/components/leetcode/sync-button";
import { LeetcodeRow } from "@/components/leetcode/leetcode-row";
import type { LeetcodeProblem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeetcodePage() {
  const supabase = getSupabaseServer();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  const { data } = await supabase
    .from("leetcode_problems")
    .select("*")
    .eq("user_id", u.user.id)
    .order("solved_at", { ascending: false });
  const lc = (data ?? []) as LeetcodeProblem[];

  const counts = {
    Easy: lc.filter((p) => p.difficulty === "Easy").length,
    Medium: lc.filter((p) => p.difficulty === "Medium").length,
    Hard: lc.filter((p) => p.difficulty === "Hard").length,
  };

  return (
    <div>
      <PageHeader
        title="LeetCode"
        subtitle={`${lc.length} problem${lc.length === 1 ? "" : "s"} solved`}
        actions={<LeetcodeSyncButton />}
      />
      <div className="px-6 py-6 md:px-10 space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge tone="success">Easy <span className="ml-1 text-muted">{counts.Easy}</span></Badge>
          <Badge tone="warn">Medium <span className="ml-1 text-muted">{counts.Medium}</span></Badge>
          <Badge tone="danger">Hard <span className="ml-1 text-muted">{counts.Hard}</span></Badge>
        </div>

        {lc.length === 0 ? (
          <Empty
            title="No problems logged yet"
            description="Click Sync from LeetCode (uses your username) or Quick add to log one manually."
          />
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-border">
              {lc.map((p) => (
                <LeetcodeRow key={p.id} problem={p} />
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
