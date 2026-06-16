"use client";

import { useState } from "react";
import { Plus, Briefcase, Code2, FolderGit2, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { JobForm } from "@/components/forms/job-form";
import { LeetcodeForm } from "@/components/forms/leetcode-form";
import { ProjectForm } from "@/components/forms/project-form";
import { DailyForm } from "@/components/forms/daily-form";

type Mode = "menu" | "job" | "leetcode" | "project" | "daily";

export function QuickAdd() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");

  function close() {
    setOpen(false);
    setTimeout(() => setMode("menu"), 200);
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="fixed bottom-20 right-4 z-30 md:bottom-6 md:right-6 shadow-card"
      >
        <Plus size={16} /> Quick add
      </Button>
      <Dialog
        open={open}
        onClose={close}
        title={
          mode === "menu"
            ? "What did you just do?"
            : mode === "job"
            ? "Log a job application"
            : mode === "leetcode"
            ? "Log a LeetCode problem"
            : mode === "project"
            ? "Add a project"
            : "Daily log"
        }
        description={mode === "menu" ? "Pick a category to log it in seconds." : undefined}
      >
        {mode === "menu" ? (
          <div className="grid grid-cols-2 gap-3">
            <MenuCard icon={<Briefcase size={18} />} label="Job applied" onClick={() => setMode("job")} />
            <MenuCard icon={<Code2 size={18} />} label="LeetCode solved" onClick={() => setMode("leetcode")} />
            <MenuCard icon={<FolderGit2 size={18} />} label="Project" onClick={() => setMode("project")} />
            <MenuCard icon={<NotebookPen size={18} />} label="Daily log" onClick={() => setMode("daily")} />
          </div>
        ) : mode === "job" ? (
          <JobForm onDone={close} />
        ) : mode === "leetcode" ? (
          <LeetcodeForm onDone={close} />
        ) : mode === "project" ? (
          <ProjectForm onDone={close} />
        ) : (
          <DailyForm onDone={close} />
        )}
      </Dialog>
    </>
  );
}

function MenuCard({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface2/60 p-4 text-left hover:border-accent/40 hover:bg-surface2 transition-colors"
    >
      <span className="text-accent">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
