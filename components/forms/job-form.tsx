"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JOB_STATUSES, JOB_STATUS_LABEL, type JobStatus } from "@/lib/types";

export function JobForm({
  onDone,
  initial,
}: {
  onDone: () => void;
  initial?: Partial<JobInput> & { id?: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState<JobInput>({
    company: initial?.company ?? "",
    title: initial?.title ?? "",
    location: initial?.location ?? "",
    url: initial?.url ?? "",
    status: (initial?.status as JobStatus) ?? "applied",
    source: initial?.source ?? "",
    salary: initial?.salary ?? "",
    notes: initial?.notes ?? "",
    applied_at: initial?.applied_at ?? new Date().toISOString().slice(0, 10),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch(initial?.id ? `/api/jobs/${initial.id}` : "/api/jobs", {
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
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company" required>
          <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
        </Field>
        <Field label="Title" required>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Location">
          <Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Remote, SF, …" />
        </Field>
        <Field label="Applied">
          <Input type="date" value={form.applied_at} onChange={(e) => setForm({ ...form, applied_at: e.target.value })} />
        </Field>
      </div>
      <Field label="Job URL">
        <Input
          value={form.url ?? ""}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          placeholder="https://…"
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Status">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as JobStatus })}>
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {JOB_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Source">
          <Input value={form.source ?? ""} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="LinkedIn, referral" />
        </Field>
        <Field label="Salary">
          <Input value={form.salary ?? ""} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="$120k" />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Recruiter contact, follow-up plan, etc." />
      </Field>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save application"}
        </Button>
      </div>
    </form>
  );
}

type JobInput = {
  company: string;
  title: string;
  location: string | null;
  url: string | null;
  status: JobStatus;
  source: string | null;
  salary: string | null;
  notes: string | null;
  applied_at: string;
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-danger"> *</span>}
      </Label>
      {children}
    </div>
  );
}
