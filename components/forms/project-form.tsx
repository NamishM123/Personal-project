"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Status = "active" | "paused" | "shipped" | "archived";

export function ProjectForm({ onDone, initial }: { onDone: () => void; initial?: Partial<ProjectInput> & { id?: string } }) {
  const router = useRouter();
  const [form, setForm] = useState<ProjectInput>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    status: (initial?.status as Status) ?? "active",
    repo_url: initial?.repo_url ?? "",
    live_url: initial?.live_url ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch(initial?.id ? `/api/projects/${initial.id}` : "/api/projects", {
      method: initial?.id ? "PATCH" : "POST",
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
      <div className="space-y-1.5">
        <Label>Project name<span className="text-danger"> *</span></Label>
        <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="What is this and why does it matter?"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="shipped">Shipped</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Repo URL</Label>
          <Input
            value={form.repo_url ?? ""}
            onChange={(e) => setForm({ ...form, repo_url: e.target.value })}
            placeholder="https://github.com/…"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Live URL</Label>
        <Input
          value={form.live_url ?? ""}
          onChange={(e) => setForm({ ...form, live_url: e.target.value })}
          placeholder="https://…"
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : initial?.id ? "Update project" : "Add project"}
        </Button>
      </div>
    </form>
  );
}

type ProjectInput = {
  name: string;
  description: string | null;
  status: Status;
  repo_url: string | null;
  live_url: string | null;
};
