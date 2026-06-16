import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stats } from "@/components/dashboard/stats";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { JOB_STATUS_LABEL, type Job, type LeetcodeProblem, type DailyLog, type Project } from "@/lib/types";
import { formatDate, relativeDay } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = getSupabaseServer();
  const { data: u } = await supabase.auth.getUser();
  const userId = u.user?.id;
  if (!userId) return null;

  const [jobsRes, lcRes, projectsRes, dailyRes] = await Promise.all([
    supabase.from("jobs").select("*").eq("user_id", userId).order("applied_at", { ascending: false }),
    supabase.from("leetcode_problems").select("*").eq("user_id", userId).order("solved_at", { ascending: false }),
    supabase.from("projects").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    supabase.from("daily_logs").select("*").eq("user_id", userId).order("day", { ascending: false }),
  ]);

  const jobs = (jobsRes.data ?? []) as Job[];
  const lc = (lcRes.data ?? []) as LeetcodeProblem[];
  const projects = (projectsRes.data ?? []) as Project[];
  const daily = (dailyRes.data ?? []) as DailyLog[];

  const now = Date.now();
  const weekAgo = now - 7 * 86_400_000;
  const jobs7 = jobs.filter((j) => new Date(j.applied_at).getTime() >= weekAgo).length;
  const lc7 = lc.filter((p) => new Date(p.solved_at).getTime() >= weekAgo).length;
  const projectsActive = projects.filter((p) => p.status === "active").length;
  const streak = computeStreak(daily.map((d) => d.day));

  const chart = build14DayActivity(jobs, lc);

  return (
    <div>
      <PageHeader
        title={`Hey${u.user?.email ? `, ${u.user.email.split("@")[0]}` : ""} \u{1F44B}`}
        subtitle="Your summer at a glance. Tap Quick add to log anything in seconds."
      />
      <div className="space-y-6 px-6 py-6 md:px-10">
        <Stats
          jobs7={jobs7}
          jobsTotal={jobs.length}
          lc7={lc7}
          lcTotal={lc.length}
          projectsActive={projectsActive}
          streak={streak}
        />

        <Card>
          <CardHeader>
            <CardTitle>Activity, last 14 days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-fg/55" /> Jobs applied
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-accent" /> LeetCode solved
              </span>
            </div>
            <ActivityChart data={chart} />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent jobs</CardTitle>
              <Link href="/jobs" className="text-xs text-muted hover:text-fg flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <Empty title="No applications yet" description="Hit Quick add or use the extension." />
              ) : (
                <ul className="divide-y divide-border">
                  {jobs.slice(0, 5).map((j) => (
                    <li key={j.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{j.company}</p>
                        <p className="truncate text-xs text-muted">{j.title}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge tone={statusTone(j.status)}>{JOB_STATUS_LABEL[j.status]}</Badge>
                        <span className="text-xs text-muted">{relativeDay(j.applied_at)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent LeetCode</CardTitle>
              <Link href="/leetcode" className="text-xs text-muted hover:text-fg flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </CardHeader>
            <CardContent>
              {lc.length === 0 ? (
                <Empty title="No problems logged yet" description="Solve one, log it, or run a sync." />
              ) : (
                <ul className="divide-y divide-border">
                  {lc.slice(0, 5).map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <a
                          href={p.url ?? `https://leetcode.com/problems/${p.slug}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-sm font-medium hover:underline"
                        >
                          {p.title}
                        </a>
                        <p className="truncate text-xs text-muted">{p.topics?.slice(0, 3).join(" · ") || p.slug}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {p.difficulty && (
                          <Badge tone={difficultyTone(p.difficulty)}>{p.difficulty}</Badge>
                        )}
                        <span className="text-xs text-muted">{relativeDay(p.solved_at)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today</CardTitle>
            <Link href="/daily" className="text-xs text-muted hover:text-fg flex items-center gap-1">
              All logs <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardContent>
            {daily[0] ? (
              <div>
                <p className="text-xs text-muted">{formatDate(daily[0].day)}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{daily[0].summary || "No summary."}</p>
              </div>
            ) : (
              <Empty title="No log for today" description="Tap Quick add → Daily log." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function computeStreak(days: string[]) {
  if (days.length === 0) return 0;
  const set = new Set(days);
  let streak = 0;
  const cursor = new Date();
  // If today not logged but yesterday is, still count from yesterday.
  if (!set.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function build14DayActivity(jobs: Job[], lc: LeetcodeProblem[]) {
  const out: { day: string; jobs: number; leetcode: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const byDay: Record<string, { jobs: number; leetcode: number }> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay[key] = { jobs: 0, leetcode: 0 };
  }
  for (const j of jobs) {
    const k = j.applied_at.slice(0, 10);
    if (byDay[k]) byDay[k].jobs++;
  }
  for (const p of lc) {
    const k = p.solved_at.slice(0, 10);
    if (byDay[k]) byDay[k].leetcode++;
  }
  for (const k of Object.keys(byDay)) {
    out.push({
      day: new Date(k).toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
      jobs: byDay[k].jobs,
      leetcode: byDay[k].leetcode,
    });
  }
  return out;
}

function statusTone(status: Job["status"]) {
  switch (status) {
    case "offer":
      return "success" as const;
    case "interview":
    case "phone_screen":
      return "accent" as const;
    case "rejected":
    case "ghosted":
      return "danger" as const;
    case "withdrew":
      return "warn" as const;
    default:
      return "neutral" as const;
  }
}

function difficultyTone(d: "Easy" | "Medium" | "Hard") {
  return d === "Easy" ? ("success" as const) : d === "Medium" ? ("warn" as const) : ("danger" as const);
}
