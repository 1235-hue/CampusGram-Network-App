import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { PostComposer } from "@/components/PostComposer";
import { PostCard, type PostWithAuthor } from "@/components/PostCard";
import { fetchFeed } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Feed · CampusGram" }] }),
  component: Home,
});

function Home() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchFeed();
      setPosts(data as never);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5">
        <header>
          <h1 className="font-display text-3xl font-semibold">Your feed</h1>
          <p className="text-sm text-muted-foreground">What's happening across campus right now.</p>
        </header>
        <PostComposer onCreated={load} />
        {loading && <p className="text-center text-sm text-muted-foreground">Loading…</p>}
        {!loading && posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            <p>No posts yet. Be the first to share something!</p>
          </div>
        )}
        {posts.map((p) => (
          <PostCard key={p.id} post={p} onChange={load} />
        ))}
      </div>
    </AppShell>
  );
}
