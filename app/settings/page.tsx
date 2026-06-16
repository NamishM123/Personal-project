import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GmailPanel } from "@/components/settings/gmail-panel";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { gmail?: string; reason?: string };
}) {
  const supabase = getSupabaseServer();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  const { data: conn } = await supabase
    .from("gmail_connections")
    .select("email, last_synced_at, created_at")
    .eq("user_id", u.user.id)
    .maybeSingle();

  const flash =
    searchParams.gmail === "ok"
      ? { kind: "ok" as const, message: "Gmail connected." }
      : searchParams.gmail === "error"
      ? { kind: "err" as const, message: `Connection failed: ${searchParams.reason ?? "unknown"}` }
      : null;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Connect integrations and manage your account." />
      <div className="space-y-6 px-6 py-6 md:px-10">
        <Card>
          <CardHeader>
            <CardTitle>Gmail auto-import</CardTitle>
            <CardDescription>
              Connect Gmail (read-only) and we&apos;ll scan for application-confirmation
              emails and add matching jobs to your tracker. Runs on demand for now;
              scheduled hourly later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GmailPanel
              connectedEmail={conn?.email ?? null}
              lastSyncedAt={conn?.last_synced_at ?? null}
              flash={flash}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signed in as</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{u.user.email}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
