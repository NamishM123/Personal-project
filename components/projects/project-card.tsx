"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Github, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { ProjectForm } from "@/components/forms/project-form";
import { type Project } from "@/lib/types";
import { relativeDay } from "@/lib/utils";

const tone: Record<Project["status"], "neutral" | "accent" | "success" | "warn"> = {
  active: "accent",
  paused: "warn",
  shipped: "success",
  archived: "neutral",
};

export function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  async function remove() {
    if (!confirm(`Delete "${project.name}"?`)) return;
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="min-w-0">
          <CardTitle className="truncate">{project.name}</CardTitle>
          <p className="mt-1 text-xs text-muted">Updated {relativeDay(project.updated_at)}</p>
        </div>
        <Badge tone={tone[project.status]}>{project.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {project.description && (
          <p className="text-sm text-muted line-clamp-3">{project.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {project.repo_url && (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-surface2"
            >
              <Github size={12} /> Repo
            </a>
          )}
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-surface2"
            >
              <ExternalLink size={12} /> Live
            </a>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setEditing(true)}
              className="rounded-md p-1.5 text-muted hover:bg-surface2 hover:text-fg"
              aria-label="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={remove}
              className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
              aria-label="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </CardContent>
      <Dialog open={editing} onClose={() => setEditing(false)} title={`Edit ${project.name}`}>
        <ProjectForm
          onDone={() => setEditing(false)}
          initial={{
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            repo_url: project.repo_url,
            live_url: project.live_url,
          }}
        />
      </Dialog>
    </Card>
  );
}
