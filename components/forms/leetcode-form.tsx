"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LeetcodeForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    slug: "",
    difficulty: "Medium" as "Easy" | "Medium" | "Hard",
    url: "",
    notes: "",
    solved_at: new Date().toISOString().slice(0, 10),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function deriveSlugAndUrl(title: string) {
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    return { slug, url: slug ? `https://leetcode.com/problems/${slug}/` : "" };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { slug, url } = form.slug ? { slug: form.slug, url: form.url } : deriveSlugAndUrl(form.title);
    const res = await fetch("/api/leetcode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, slug, url, source: "manual" }),
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
      <div className="space-y-1.5">
        <Label>Problem title<span className="text-danger"> *</span></Label>
        <Input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Two Sum"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Difficulty</Label>
          <Select
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value as "Easy" | "Medium" | "Hard" })}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Solved on</Label>
          <Input
            type="date"
            value={form.solved_at}
            onChange={(e) => setForm({ ...form, solved_at: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>URL (optional, auto-derived from title)</Label>
        <Input
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          placeholder="https://leetcode.com/problems/two-sum/"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Approach, gotchas, time complexity"
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save problem"}
        </Button>
      </div>
    </form>
  );
}
