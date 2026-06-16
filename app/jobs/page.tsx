import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { JobRow } from "@/components/jobs/job-row";
import { JOB_STATUSES, JOB_STATUS_LABEL, type Job } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const supabase = getSupabaseServer();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("user_id", u.user.id)
    .order("applied_at", { ascending: false });
  const jobs = (data ?? []) as Job[];

  const counts = JOB_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = jobs.filter((j) => j.status === s).length;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Jobs"
        subtitle={`${jobs.length} application${jobs.length === 1 ? "" : "s"} tracked`}
      />
      <div className="px-6 py-6 md:px-10 space-y-6">
        <div className="flex flex-wrap gap-2">
          {JOB_STATUSES.map((s) => (
            <Badge key={s}>
              {JOB_STATUS_LABEL[s]} <span className="ml-1 text-muted">{counts[s] ?? 0}</span>
            </Badge>
          ))}
        </div>

        {jobs.length === 0 ? (
          <Empty
            title="No applications yet"
            description="Use the Quick add button or install the browser extension to save jobs from LinkedIn / Indeed / company sites in one click."
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="hidden grid-cols-12 gap-3 border-b border-border px-5 py-3 text-xs font-medium text-muted md:grid">
              <div className="col-span-3">Company</div>
              <div className="col-span-3">Title</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Applied</div>
              <div className="col-span-2 text-right">Link</div>
            </div>
            <ul className="divide-y divide-border">
              {jobs.map((j) => (
                <JobRow key={j.id} job={j} />
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
