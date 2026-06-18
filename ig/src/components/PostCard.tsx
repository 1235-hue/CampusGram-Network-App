"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { timeAgo, cn } from "@/lib/utils";

type Media = { id: string; url: string; kind: string };
type Author = { id: string; username: string; image: string | null; name: string | null };
type Post = { id: string; caption: string | null; createdAt: string | Date; location: string | null };

export function PostCard({
  post, author, media, likeCount, commentCount, liked, saved,
}: {
  post: Post; author: Author; media: Media[];
  likeCount: number; commentCount: number; liked: boolean; saved: boolean;
}) {
  const [isLiked, setLiked] = useState(liked);
  const [isSaved, setSaved] = useState(saved);
  const [likes, setLikes] = useState(likeCount);
  const [idx, setIdx] = useState(0);

  async function toggleLike() {
    setLiked(!isLiked); setLikes(likes + (isLiked ? -1 : 1));
    await fetch(`/api/posts/${post.id}/like`, { method: isLiked ? "DELETE" : "POST" });
  }
  async function toggleSave() {
    setSaved(!isSaved);
    await fetch(`/api/posts/${post.id}/save`, { method: isSaved ? "DELETE" : "POST" });
  }

  return (
    <article className="border border-ig-borderdark md:rounded-lg overflow-hidden bg-black">
      <header className="flex items-center gap-3 px-3 py-2">
        <Link href={`/${author.username}`} className="flex items-center gap-3 flex-1">
          <div className="story-ring viewed">
            <Image src={author.image || "/default-avatar.png"} alt="" width={32} height={32} className="rounded-full bg-zinc-800" />
          </div>
          <div>
            <div className="text-sm font-semibold">{author.username}</div>
            {post.location && <div className="text-xs text-ig-muted">{post.location}</div>}
          </div>
        </Link>
        <button><MoreHorizontal className="w-5 h-5" /></button>
      </header>

      <div className="relative bg-black aspect-square">
        {media[idx]?.kind === "video" ? (
          <video src={media[idx].url} controls className="w-full h-full object-contain" />
        ) : media[idx] ? (
          <Image src={media[idx].url} alt="" fill className="object-cover" />
        ) : null}
        {media.length > 1 && (
          <>
            {idx > 0 && (
              <button onClick={() => setIdx(idx - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 rounded-full p-1">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {idx < media.length - 1 && (
              <button onClick={() => setIdx(idx + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 rounded-full p-1">
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {media.map((_, i) => (
                <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i === idx ? "bg-ig-accent" : "bg-white/50")} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="px-3 py-2">
        <div className="flex items-center gap-3">
          <button onClick={toggleLike}>
            <Heart className={cn("w-7 h-7", isLiked && "fill-ig-danger stroke-ig-danger")} />
          </button>
          <Link href={`/p/${post.id}`}><MessageCircle className="w-7 h-7" /></Link>
          <button><Send className="w-7 h-7" /></button>
          <button onClick={toggleSave} className="ml-auto">
            <Bookmark className={cn("w-7 h-7", isSaved && "fill-white")} />
          </button>
        </div>
        <div className="text-sm font-semibold mt-2">{likes.toLocaleString()} likes</div>
        {post.caption && (
          <p className="text-sm mt-1">
            <Link href={`/${author.username}`} className="font-semibold mr-1">{author.username}</Link>
            {post.caption}
          </p>
        )}
        {commentCount > 0 && (
          <Link href={`/p/${post.id}`} className="block text-sm text-ig-muted mt-1">
            View all {commentCount} comments
          </Link>
        )}
        <div className="text-[10px] uppercase text-ig-muted mt-2">{timeAgo(post.createdAt)} ago</div>
      </div>
    </article>
  );
}
