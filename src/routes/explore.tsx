import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Search } from "lucide-react";

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [{ title: "Explore · CampusGram" }] }),
  component: Explore,
});

type P = { id: string; username: string; full_name: string | null; avatar_url: string | null; major: string | null };

function Explore() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [people, setPeople] = useState<P[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    let query = supabase.from("profiles").select("id, username, full_name, avatar_url, major").limit(30);
    if (q.trim()) query = query.or(`username.ilike.%${q}%,full_name.ilike.%${q}%`);
    query.then(({ data }) => setPeople((data as P[]) ?? []));
  }, [q]);

  useEffect(() => {
    if (!user) return;
    supabase.from("follows").select("following_id").eq("follower_id", user.id)
      .then(({ data }) => setFollowing(new Set(((data as { following_id: string }[]) ?? []).map((d) => d.following_id))));
  }, [user]);

  async function toggleFollow(id: string) {
    if (!user || id === user.id) return;
    const next = new Set(following);
    if (next.has(id)) {
      next.delete(id);
      setFollowing(next);
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", id);
    } else {
      next.add(id);
      setFollowing(next);
      await supabase.from("follows").insert({ follower_id: user.id, following_id: id });
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="font-display text-3xl font-semibold">Explore</h1>
          <p className="text-sm text-muted-foreground">Find classmates, lecturers, and people to follow.</p>
        </header>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people by name or username…"
            className="w-full rounded-full border border-input bg-card py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {people.map((p) => {
            const isMe = p.id === user?.id;
            const isFollowing = following.has(p.id);
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <Link to="/profile/$username" params={{ username: p.username }}>
                  <Avatar src={p.avatar_url} name={p.full_name ?? p.username} size={48} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to="/profile/$username" params={{ username: p.username }} className="block truncate font-semibold hover:underline">
                    {p.full_name || p.username}
                  </Link>
                  <div className="truncate text-xs text-muted-foreground">@{p.username}{p.major ? ` · ${p.major}` : ""}</div>
                </div>
                {!isMe && (
                  <button
                    onClick={() => toggleFollow(p.id)}
                    className={
                      isFollowing
                        ? "rounded-full border border-input bg-background px-4 py-1.5 text-xs font-semibold hover:bg-accent"
                        : "rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    }
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
