"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/input";
import { JobForm } from "@/components/forms/job-form";
import { JOB_STATUSES, JOB_STATUS_LABEL, type Job } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function JobRow({ job }: { job: Job }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(job.status);
  const [saving, setSaving] = useState(false);

  async function updateStatus(next: Job["status"]) {
    setStatus(next);
    setSaving(true);
    await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSaving(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Delete the application to ${job.company}?`)) return;
    await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <li className="grid grid-cols-1 gap-2 px-5 py-3 hover:bg-surface2/40 md:grid-cols-12 md:items-center md:gap-3">
      <div className="md:col-span-3">
        <p className="text-sm font-medium">{job.company}</p>
        {job.location && <p className="text-xs text-muted">{job.location}</p>}
      </div>
      <div className="md:col-span-3 text-sm">{job.title}</div>
      <div className="md:col-span-2">
        <Select
          value={status}
          onChange={(e) => updateStatus(e.target.value as Job["status"])}
          className="h-8 text-xs"
          disabled={saving}
        >
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {JOB_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>
      <div className="md:col-span-2 text-xs text-muted">{formatDate(job.applied_at)}</div>
      <div className="md:col-span-2 flex items-center justify-end gap-1">
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md p-1.5 text-muted hover:bg-surface2 hover:text-fg"
            title="Open posting"
          >
            <ExternalLink size={14} />
          </a>
        )}
        <button
          onClick={() => setEditing(true)}
          className="rounded-md p-1.5 text-muted hover:bg-surface2 hover:text-fg"
          title="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={remove}
          className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <Dialog open={editing} onClose={() => setEditing(false)} title={`Edit — ${job.company}`}>
        <JobForm
          onDone={() => setEditing(false)}
          initial={{
            id: job.id,
            company: job.company,
            title: job.title,
            location: job.location,
            url: job.url,
            status: job.status,
            source: job.source,
            salary: job.salary,
            notes: job.notes,
            applied_at: job.applied_at.slice(0, 10),
          }}
        />
      </Dialog>
    </li>
  );
}
