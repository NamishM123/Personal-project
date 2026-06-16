"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function DailyForm({ onDone, initial }: { onDone: () => void; initial?: Partial<DailyInput> }) {
  const router = useRouter();
  const [form, setForm] = useState<DailyInput>({
    day: initial?.day ?? new Date().toISOString().slice(0, 10),
    summary: initial?.summary ?? "",
    highlights: initial?.highlights ?? "",
    hours_focused: initial?.hours_focused ?? null,
    mood: initial?.mood ?? null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Failed to save");
      return;
    }
    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Day</Label>
          <Input type="date" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Hours focused</Label>
          <Input
            type="number"
            step="0.5"
            min={0}
            max={24}
            value={form.hours_focused ?? ""}
            onChange={(e) => setForm({ ...form, hours_focused: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Mood (1 to 5)</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setForm({ ...form, mood: form.mood === n ? null : n })}
              className={`h-9 w-9 rounded-lg border text-sm font-medium transition-colors ${
                form.mood === n ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:bg-surface2"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>What did you do today?</Label>
        <Textarea
          value={form.summary ?? ""}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          placeholder="Built the auth flow, applied to 4 SWE roles, finished 3 LC mediums."
        />
      </div>
      <div className="space-y-1.5">
        <Label>Highlights / wins</Label>
        <Textarea
          value={form.highlights ?? ""}
          onChange={(e) => setForm({ ...form, highlights: e.target.value })}
          placeholder="First DP problem I solved without hints!"
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save log"}
        </Button>
      </div>
    </form>
  );
}

type DailyInput = {
  day: string;
  summary: string | null;
  highlights: string | null;
  hours_focused: number | null;
  mood: number | null;
};
