import { useEffect, useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Course = { id: string; code: string; title: string };

export function PostComposer({ onCreated, defaultCourseId }: { onCreated?: () => void; defaultCourseId?: string }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string>(defaultCourseId ?? "");
  const [courses, setCourses] = useState<Course[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || defaultCourseId) return;
    supabase
      .from("course_members")
      .select("course:courses(id, code, title)")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setCourses(((data as never as { course: Course }[]) ?? []).map((r) => r.course).filter(Boolean));
      });
  }, [user, defaultCourseId]);

  function pickFile(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || (!content.trim() && !file)) return;
    setBusy(true);
    try {
      let image_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("campusgram").upload(path, file);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("campusgram").getPublicUrl(path);
        image_url = data.publicUrl;
      }
      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        content: content.trim(),
        image_url,
        course_id: courseId || null,
      });
      if (error) throw error;
      setContent("");
      pickFile(null);
      onCreated?.();
      toast.success("Posted");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share something with campus…"
        rows={3}
        className="w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
      />
      {preview && (
        <div className="relative mt-2 inline-block">
          <img src={preview} alt="" className="max-h-64 rounded-lg" />
          <button type="button" onClick={() => pickFile(null)} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <button type="button" onClick={() => fileRef.current?.click()} className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
          <ImagePlus className="h-5 w-5" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
        {!defaultCourseId && courses.length > 0 && (
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="">No course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </select>
        )}
        <button
          type="submit"
          disabled={busy || (!content.trim() && !file)}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-crimson px-5 py-2 text-sm font-semibold text-crimson-foreground transition-opacity disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Post
        </button>
      </div>
    </form>
  );
}
