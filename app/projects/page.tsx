import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Empty } from "@/components/ui/empty";
import { ProjectCard } from "@/components/projects/project-card";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const supabase = getSupabaseServer();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", u.user.id)
    .order("updated_at", { ascending: false });
  const projects = (data ?? []) as Project[];

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} project${projects.length === 1 ? "" : "s"}`}
      />
      <div className="px-6 py-6 md:px-10">
        {projects.length === 0 ? (
          <Empty
            title="No projects yet"
            description="Add your side projects and update their status as they progress."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
