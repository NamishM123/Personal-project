export type JobStatus =
  | "applied"
  | "phone_screen"
  | "interview"
  | "offer"
  | "rejected"
  | "ghosted"
  | "withdrew";

export type Job = {
  id: string;
  user_id: string;
  company: string;
  title: string;
  location: string | null;
  url: string | null;
  status: JobStatus;
  source: string | null;
  notes: string | null;
  salary: string | null;
  applied_at: string;
  created_at: string;
};

export type LeetcodeProblem = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[] | null;
  url: string | null;
  solved_at: string;
  source: "manual" | "sync";
  runtime_ms: number | null;
  notes: string | null;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: "active" | "paused" | "shipped" | "archived";
  repo_url: string | null;
  live_url: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyLog = {
  id: string;
  user_id: string;
  day: string; // YYYY-MM-DD
  summary: string | null;
  highlights: string | null;
  hours_focused: number | null;
  mood: number | null;
  created_at: string;
};

export const JOB_STATUSES: JobStatus[] = [
  "applied",
  "phone_screen",
  "interview",
  "offer",
  "rejected",
  "ghosted",
  "withdrew",
];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  applied: "Applied",
  phone_screen: "Phone screen",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  ghosted: "Ghosted",
  withdrew: "Withdrew",
};
