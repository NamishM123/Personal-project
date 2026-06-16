"use client";

import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type LeetcodeProblem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function LeetcodeRow({ problem }: { problem: LeetcodeProblem }) {
  const router = useRouter();
  async function remove() {
    if (!confirm(`Remove "${problem.title}" from log?`)) return;
    await fetch(`/api/leetcode/${problem.id}`, { method: "DELETE" });
    router.refresh();
  }
  const url = problem.url ?? `https://leetcode.com/problems/${problem.slug}/`;
  return (
    <li className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface2/40">
      <div className="min-w-0 flex-1">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium hover:underline"
        >
          {problem.title}
        </a>
        <p className="mt-0.5 truncate text-xs text-muted">
          {problem.topics?.slice(0, 5).join(" · ") || problem.slug}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {problem.difficulty && (
          <Badge tone={problem.difficulty === "Easy" ? "success" : problem.difficulty === "Medium" ? "warn" : "danger"}>
            {problem.difficulty}
          </Badge>
        )}
        {problem.source === "sync" && <Badge tone="accent">synced</Badge>}
        <span className="text-xs text-muted">{formatDate(problem.solved_at)}</span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="rounded-md p-1.5 text-muted hover:bg-surface2 hover:text-fg"
        >
          <ExternalLink size={14} />
        </a>
        <button
          onClick={remove}
          className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}
