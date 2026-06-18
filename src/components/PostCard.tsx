import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type PostWithAuthor = {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author_id: string;
  course_id: string | null;
  author: { username: string; full_name: string | null; avatar_url: string | null } | null;
  course: { code: string; title: string } | null;
  likes: { user_id: string }[];
  comments: { count: number }[];
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function PostCard({ post, onChange }: { post: PostWithAuthor; onChange?: () => void }) {
  const { user } = useAuth();
  const myLike = post.likes.some((l) => l.user_id === user?.id);
  const [liked, setLiked] = useState(myLike);
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<
    { id: string; content: string; created_at: string; author: { username: string; full_name: string | null; avatar_url: string | null } | null }[]
  >([]);
  const [newComment, setNewComment] = useState("");
  const commentCount = post.comments[0]?.count ?? 0;

  async function toggleLike() {
    if (!user) return;
    if (liked) {
      setLiked(false);
      setLikeCount((c) => c - 1);
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
    }
  }

  async function loadComments() {
    setShowComments((s) => !s);
    if (showComments) return;
    const { data } = await supabase
      .from("comments")
      .select("id, content, created_at, author:profiles!comments_author_id_fkey(username, full_name, avatar_url)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
    setComments((data as never) ?? []);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: post.id, author_id: user.id, content: newComment.trim() })
      .select("id, content, created_at, author:profiles!comments_author_id_fkey(username, full_name, avatar_url)")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setComments((c) => [...c, data as never]);
    setNewComment("");
  }

  async function deletePost() {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) toast.error(error.message);
    else onChange?.();
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <header className="flex items-start gap-3">
        <Link to="/profile/$username" params={{ username: post.author?.username ?? "" }}>
          <Avatar src={post.author?.avatar_url} name={post.author?.full_name ?? post.author?.username} size={44} />
        </Link>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <Link to="/profile/$username" params={{ username: post.author?.username ?? "" }} className="font-semibold hover:underline">
              {post.author?.full_name || post.author?.username}
            </Link>
            <span className="text-sm text-muted-foreground">@{post.author?.username}</span>
            <span className="text-sm text-muted-foreground">· {timeAgo(post.created_at)}</span>
          </div>
          {post.course && (
            <Link to="/courses/$id" params={{ id: post.course_id! }} className="text-xs font-medium text-crimson hover:underline">
              {post.course.code} · {post.course.title}
            </Link>
          )}
        </div>
        {user?.id === post.author_id && (
          <button onClick={deletePost} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>

      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</p>

      {post.image_url && (
        <div className="mt-3 overflow-hidden rounded-xl border border-border">
          <img src={post.image_url} alt="" className="w-full object-cover" />
        </div>
      )}

      <footer className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
        <button onClick={toggleLike} className={cn("flex items-center gap-1.5 transition-colors hover:text-crimson", liked && "text-crimson")}>
          <Heart className={cn("h-5 w-5", liked && "fill-current")} />
          <span>{likeCount}</span>
        </button>
        <button onClick={loadComments} className="flex items-center gap-1.5 hover:text-foreground">
          <MessageCircle className="h-5 w-5" />
          <span>{commentCount}</span>
        </button>
      </footer>

      {showComments && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar src={c.author?.avatar_url} name={c.author?.full_name ?? c.author?.username} size={32} />
              <div className="flex-1 rounded-xl bg-secondary px-3 py-2">
                <div className="text-xs font-medium">{c.author?.username}</div>
                <div className="text-sm">{c.content}</div>
              </div>
            </div>
          ))}
          <form onSubmit={submitComment} className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment…"
              className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Post
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
