"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";

export function LeetcodeSyncButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { fetched: number; inserted: number; errors: string[] }>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/leetcode/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username || undefined, limit: 50 }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) setError(json.error || "Sync failed");
    else {
      setResult(json);
      router.refresh();
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <RefreshCw size={14} /> Sync from LeetCode
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Sync recent submissions"
        description="We'll fetch your last 50 accepted submissions from LeetCode and add new ones."
      >
        <div className="space-y-3">
          <div>
            <Label>LeetCode username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="leave blank to use LEETCODE_USERNAME env"
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          {result && (
            <div className="rounded-lg border border-border bg-surface2/50 p-3 text-xs">
              Fetched {result.fetched}, added {result.inserted}.
              {result.errors.length > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-muted">{result.errors.length} error(s)</summary>
                  <pre className="mt-1 whitespace-pre-wrap">{result.errors.join("\n")}</pre>
                </details>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={run} disabled={loading}>
              {loading ? "Syncing…" : "Sync now"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
