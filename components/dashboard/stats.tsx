import { Briefcase, Code2, FolderGit2, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";

export function Stats({
  jobs7,
  jobsTotal,
  lc7,
  lcTotal,
  projectsActive,
  streak,
}: {
  jobs7: number;
  jobsTotal: number;
  lc7: number;
  lcTotal: number;
  projectsActive: number;
  streak: number;
}) {
  const items = [
    { icon: <Briefcase size={16} />, label: "Jobs applied", main: jobsTotal, sub: `${jobs7} this week` },
    { icon: <Code2 size={16} />, label: "LeetCode solved", main: lcTotal, sub: `${lc7} this week` },
    { icon: <FolderGit2 size={16} />, label: "Active projects", main: projectsActive, sub: "—" },
    { icon: <Flame size={16} />, label: "Daily-log streak", main: streak, sub: streak === 1 ? "day" : "days" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((s) => (
        <Card key={s.label} className="p-4">
          <div className="flex items-center gap-2 text-muted">
            {s.icon}
            <span className="text-xs font-medium">{s.label}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight">{s.main}</span>
            <span className="text-xs text-muted">{s.sub}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
