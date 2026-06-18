import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { PostCard, type PostWithAuthor } from "@/components/PostCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { POST_SELECT } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/profile/$username")({
  head: () => ({ meta: [{ title: "Profile · CampusGram" }] }),
  component: ProfilePage,
});

type Profile = {
  id: string; username: string; full_name: string | null; avatar_url: string | null;
  bio: string | null; major: string | null; year_of_study: number | null;
};

function ProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const { data: p } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, bio, major, year_of_study")
      .eq("username", username)
      .maybeSingle();
    if (!p) return;
    setProfile(p as Profile);
    const [{ data: posts }, { count: followers }, { count: following }, { data: f }] = await Promise.all([
      supabase.from("posts").select(POST_SELECT).eq("author_id", (p as Profile).id).order("created_at", { ascending: false }),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", (p as Profile).id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", (p as Profile).id),
      user ? supabase.from("follows").select("following_id").eq("follower_id", user.id).eq("following_id", (p as Profile).id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    setPosts((posts as never) ?? []);
    setCounts({ followers: followers ?? 0, following: following ?? 0 });
    setIsFollowing(!!f);
  }, [username, user]);

  useEffect(() => { void load(); }, [load]);

  async function toggleFollow() {
    if (!user || !profile) return;
    if (isFollowing) {
      setIsFollowing(false);
      setCounts((c) => ({ ...c, followers: c.followers - 1 }));
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id);
    } else {
      setIsFollowing(true);
      setCounts((c) => ({ ...c, followers: c.followers + 1 }));
      await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.id });
    }
  }

  if (!profile) {
    return <AppShell><p className="text-center text-muted-foreground">Loading…</p></AppShell>;
  }

  const isMe = user?.id === profile.id;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-5">
            <Avatar src={profile.avatar_url} name={profile.full_name ?? profile.username} size={96} />
            <div className="flex-1">
              <h1 className="font-display text-2xl font-semibold">{profile.full_name || profile.username}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
              {(profile.major || profile.year_of_study) && (
                <p className="mt-1 text-sm">
                  {profile.major}{profile.major && profile.year_of_study ? " · " : ""}
                  {profile.year_of_study ? `Year ${profile.year_of_study}` : ""}
                </p>
              )}
              <div className="mt-3 flex gap-5 text-sm">
                <span><strong>{posts.length}</strong> <span className="text-muted-foreground">posts</span></span>
                <span><strong>{counts.followers}</strong> <span className="text-muted-foreground">followers</span></span>
                <span><strong>{counts.following}</strong> <span className="text-muted-foreground">following</span></span>
              </div>
            </div>
            {isMe ? (
              <button onClick={() => setEditing(true)} className="rounded-full border border-input px-4 py-1.5 text-sm font-semibold hover:bg-accent">
                Edit profile
              </button>
            ) : (
              <button
                onClick={toggleFollow}
                className={
                  isFollowing
                    ? "rounded-full border border-input px-5 py-1.5 text-sm font-semibold hover:bg-accent"
                    : "rounded-full bg-crimson px-5 py-1.5 text-sm font-semibold text-crimson-foreground hover:opacity-90"
                }
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
          {profile.bio && <p className="mt-4 whitespace-pre-wrap text-sm">{profile.bio}</p>}
        </div>

        {editing && isMe && <EditProfile profile={profile} onDone={() => { setEditing(false); void load(); }} />}

        <h2 className="font-display text-xl font-semibold">Posts</h2>
        {posts.length === 0 && <p className="text-sm text-muted-foreground">No posts yet.</p>}
        {posts.map((p) => <PostCard key={p.id} post={p} onChange={load} />)}
      </div>
    </AppShell>
  );
}

function EditProfile({ profile, onDone }: { profile: Profile; onDone: () => void }) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [major, setMajor] = useState(profile.major ?? "");
  const [year, setYear] = useState(profile.year_of_study?.toString() ?? "");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName, bio, major, year_of_study: year ? Number(year) : null,
    }).eq("id", profile.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); onDone(); }
  }

  return (
    <form onSubmit={save} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Full name" value={fullName} onChange={setFullName} />
        <Input label="Major" value={major} onChange={setMajor} />
        <Input label="Year of study" value={year} onChange={setYear} type="number" />
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Bio</span>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent">Cancel</button>
        <button type="submit" disabled={busy} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Save</button>
      </div>
    </form>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}
