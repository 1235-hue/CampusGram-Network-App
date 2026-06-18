import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { PostCard, type PostWithAuthor } from "@/components/PostCard";
import { PostComposer } from "@/components/PostComposer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { POST_SELECT } from "@/lib/queries";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/courses/$id")({
  head: () => ({ meta: [{ title: "Course · CampusGram" }] }),
  component: CoursePage,
});

type Course = { id: string; code: string; title: string; description: string | null };

function CoursePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [joined, setJoined] = useState(false);

  const load = useCallback(async () => {
    const { data: c } = await supabase.from("courses").select("id, code, title, description").eq("id", id).maybeSingle();
    setCourse(c as Course | null);
    const { data: p } = await supabase.from("posts").select(POST_SELECT).eq("course_id", id).order("created_at", { ascending: false });
    setPosts((p as never) ?? []);
    const { count } = await supabase.from("course_members").select("*", { count: "exact", head: true }).eq("course_id", id);
    setMemberCount(count ?? 0);
    if (user) {
      const { data: m } = await supabase.from("course_members").select("user_id").eq("course_id", id).eq("user_id", user.id).maybeSingle();
      setJoined(!!m);
    }
  }, [id, user]);

  useEffect(() => { void load(); }, [load]);

  async function toggleJoin() {
    if (!user) return;
    if (joined) await supabase.from("course_members").delete().eq("course_id", id).eq("user_id", user.id);
    else await supabase.from("course_members").insert({ course_id: id, user_id: user.id });
    void load();
  }

  if (!course) return <AppShell><p className="text-center text-muted-foreground">Loading…</p></AppShell>;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary text-primary-foreground">
              <BookOpen className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-crimson">{course.code}</div>
              <h1 className="font-display text-2xl font-semibold">{course.title}</h1>
              <p className="text-sm text-muted-foreground">{memberCount} members</p>
            </div>
            <button onClick={toggleJoin}
              className={joined
                ? "rounded-full border border-input px-4 py-1.5 text-sm font-semibold hover:bg-accent"
                : "rounded-full bg-crimson px-4 py-1.5 text-sm font-semibold text-crimson-foreground hover:opacity-90"}>
              {joined ? "Joined" : "Join"}
            </button>
          </div>
          {course.description && <p className="mt-4 text-sm">{course.description}</p>}
        </div>

        {joined && <PostComposer defaultCourseId={id} onCreated={load} />}

        <h2 className="font-display text-xl font-semibold">Course feed</h2>
        {posts.length === 0 && <p className="text-sm text-muted-foreground">No posts in this course yet.</p>}
        {posts.map((p) => <PostCard key={p.id} post={p} onChange={load} />)}
      </div>
    </AppShell>
  );
}
