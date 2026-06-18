import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/courses/")({
  head: () => ({ meta: [{ title: "Courses · CampusGram" }] }),
  component: Courses,
});

type Course = { id: string; code: string; title: string; description: string | null; member_count: number; joined: boolean };

function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [creating, setCreating] = useState(false);

  async function load() {
    const { data: cs } = await supabase.from("courses").select("id, code, title, description").order("code");
    const ids = (cs ?? []).map((c) => c.id);
    const { data: mine } = user
      ? await supabase.from("course_members").select("course_id").eq("user_id", user.id).in("course_id", ids.length ? ids : [""])
      : { data: [] };
    const joinedSet = new Set(((mine as { course_id: string }[]) ?? []).map((m) => m.course_id));
    const counts: Record<string, number> = {};
    for (const id of ids) {
      const { count } = await supabase.from("course_members").select("*", { count: "exact", head: true }).eq("course_id", id);
      counts[id] = count ?? 0;
    }
    setCourses(((cs as Omit<Course, "member_count" | "joined">[]) ?? []).map((c) => ({
      ...c, member_count: counts[c.id] ?? 0, joined: joinedSet.has(c.id),
    })));
  }

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  async function toggleJoin(c: Course) {
    if (!user) return;
    if (c.joined) {
      await supabase.from("course_members").delete().eq("course_id", c.id).eq("user_id", user.id);
    } else {
      await supabase.from("course_members").insert({ course_id: c.id, user_id: user.id });
    }
    void load();
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold">Courses</h1>
            <p className="text-sm text-muted-foreground">Join your classes and follow the conversation.</p>
          </div>
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> New course
          </button>
        </header>

        {creating && <CreateCourse onDone={() => { setCreating(false); void load(); }} />}

        <div className="grid gap-3 sm:grid-cols-2">
          {courses.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-secondary text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link to="/courses/$id" params={{ id: c.id }} className="block">
                    <div className="text-xs font-semibold uppercase tracking-wider text-crimson">{c.code}</div>
                    <div className="truncate font-semibold hover:underline">{c.title}</div>
                  </Link>
                  {c.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                  <div className="mt-2 text-xs text-muted-foreground">{c.member_count} members</div>
                </div>
              </div>
              <button
                onClick={() => toggleJoin(c)}
                className={
                  c.joined
                    ? "mt-3 w-full rounded-full border border-input py-1.5 text-xs font-semibold hover:bg-accent"
                    : "mt-3 w-full rounded-full bg-crimson py-1.5 text-xs font-semibold text-crimson-foreground hover:opacity-90"
                }
              >
                {c.joined ? "Joined" : "Join course"}
              </button>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No courses yet. Create the first one.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function CreateCourse({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { data, error } = await supabase.from("courses")
      .insert({ code: code.trim().toUpperCase(), title: title.trim(), description: description.trim() || null, created_by: user.id })
      .select("id").single();
    if (!error && data) {
      await supabase.from("course_members").insert({ course_id: data.id, user_id: user.id, role: "lecturer" });
      toast.success("Course created");
      onDone();
    } else if (error) toast.error(error.message);
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
        <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="CS101"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Intro to Computer Science"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent">Cancel</button>
        <button type="submit" disabled={busy} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Create</button>
      </div>
    </form>
  );
}
