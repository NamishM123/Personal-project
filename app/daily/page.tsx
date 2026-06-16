import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import type { DailyLog } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DailyPage() {
  const supabase = getSupabaseServer();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", u.user.id)
    .order("day", { ascending: false });
  const logs = (data ?? []) as DailyLog[];

  return (
    <div>
      <PageHeader title="Daily log" subtitle={`${logs.length} day${logs.length === 1 ? "" : "s"} logged`} />
      <div className="px-6 py-6 md:px-10">
        {logs.length === 0 ? (
          <Empty title="No daily logs yet" description="A daily log keeps your streak alive and gives you a record of the summer." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{formatDate(log.day, { weekday: "long" })}</p>
                    <p className="text-xs text-muted">{formatDate(log.day)}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    {log.hours_focused != null && <span>{log.hours_focused}h focused</span>}
                    {log.mood != null && <span>mood {log.mood}/5</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {log.summary && <p className="whitespace-pre-wrap text-sm">{log.summary}</p>}
                  {log.highlights && (
                    <div className="rounded-lg border border-border bg-surface2/40 p-3 text-sm">
                      <p className="mb-1 text-xs font-medium text-muted">Highlights</p>
                      <p className="whitespace-pre-wrap">{log.highlights}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
