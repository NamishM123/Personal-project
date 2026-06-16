"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type Flash = { kind: "ok" | "err"; message: string } | null;
type SyncResult = {
  scanned: number;
  matched: number;
  inserted: number;
  duplicates: number;
  skipped: number;
  errors: string[];
};

export function GmailPanel({
  connectedEmail,
  lastSyncedAt,
  flash,
}: {
  connectedEmail: string | null;
  lastSyncedAt: string | null;
  flash: Flash;
}) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSync() {
    setSyncing(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/gmail/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: 60, limit: 50 }),
    });
    const json = await res.json().catch(() => ({}));
    setSyncing(false);
    if (!res.ok) setError(json.error || "Sync failed");
    else {
      setResult(json as SyncResult);
      router.refresh();
    }
  }

  async function disconnect() {
    if (!confirm("Disconnect Gmail? We'll stop importing applications.")) return;
    await fetch("/api/gmail/disconnect", { method: "POST" });
    router.refresh();
  }

  if (!connectedEmail) {
    return (
      <div className="space-y-3">
        {flash && (
          <p className={`text-xs ${flash.kind === "ok" ? "text-success" : "text-danger"}`}>
            {flash.message}
          </p>
        )}
        <a
          href="/api/gmail/connect"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-transform active:scale-[0.97] hover:bg-accent/90"
        >
          <Mail size={14} /> Connect Gmail
        </a>
        <p className="text-xs text-muted">
          We request read-only access. Nothing is sent, no labels are modified.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {flash && (
        <p className={`text-xs ${flash.kind === "ok" ? "text-success" : "text-danger"}`}>
          {flash.message}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="success">Connected</Badge>
        <span className="text-sm">{connectedEmail}</span>
        {lastSyncedAt && (
          <span className="text-xs text-muted">Last sync {formatDate(lastSyncedAt)}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={runSync} disabled={syncing}>
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing…" : "Sync now"}
        </Button>
        <Button variant="ghost" onClick={disconnect}>
          Disconnect
        </Button>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
      {result && (
        <div className="rounded-lg border border-border bg-surface2/40 p-3 text-xs">
          Scanned {result.scanned} emails, matched {result.matched}, added{" "}
          <span className="font-semibold">{result.inserted}</span> jobs (
          {result.duplicates} already imported, {result.skipped} skipped).
          {result.errors.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer text-muted">
                {result.errors.length} error{result.errors.length === 1 ? "" : "s"}
              </summary>
              <pre className="mt-1 whitespace-pre-wrap">{result.errors.join("\n")}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
