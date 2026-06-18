"use client";
import { useEffect, useRef } from "react";
import { Heart, MessageCircle, Send, Music } from "lucide-react";
import Image from "next/image";

type Reel = { id: string; caption: string | null; audioTitle: string | null; url: string; username: string; image: string | null };

export function ReelsPlayer({ reels }: { reels: Reel[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = e.target.querySelector("video");
        if (!v) return;
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      });
    }, { threshold: 0.7 });
    ref.current?.querySelectorAll("[data-reel]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reels.length]);

  return (
    <div ref={ref} className="reel-snap h-[calc(100vh-3rem)] md:h-screen overflow-y-scroll bg-black">
      {reels.map((r) => (
        <div key={r.id} data-reel className="relative h-[calc(100vh-3rem)] md:h-screen flex items-center justify-center">
          <video src={r.url} loop playsInline className="max-h-full max-w-full" />
          <div className="absolute bottom-6 left-4 right-16 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Image src={r.image || "/default-avatar.png"} alt="" width={32} height={32} className="rounded-full bg-zinc-800" />
              <span className="font-semibold">{r.username}</span>
            </div>
            {r.caption && <p className="text-sm mb-1 line-clamp-2">{r.caption}</p>}
            {r.audioTitle && <p className="text-xs flex items-center gap-1"><Music className="w-3 h-3"/> {r.audioTitle}</p>}
          </div>
          <div className="absolute right-3 bottom-12 flex flex-col gap-5 text-white">
            <button><Heart className="w-7 h-7" /></button>
            <button><MessageCircle className="w-7 h-7" /></button>
            <button><Send className="w-7 h-7" /></button>
          </div>
        </div>
      ))}
      {reels.length === 0 && <div className="h-screen flex items-center justify-center text-ig-muted">No reels yet.</div>}
    </div>
  );
}
