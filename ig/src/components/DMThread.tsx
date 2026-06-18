"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { id: string; body: string | null; senderId: string; createdAt: string; senderName: string; senderImage: string | null };

export function DMThread({ threadId, me, initial }: { threadId: string; me: string; initial: Msg[] }) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource(`/api/messages/stream?thread=${threadId}`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.id) setMsgs((m) => (m.some((x) => x.id === data.id) ? m : [...m, data]));
      } catch {}
    };
    return () => es.close();
  }, [threadId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  async function send() {
    if (!text.trim()) return;
    const body = text; setText("");
    await fetch("/api/messages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ threadId, body }) });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] md:h-screen max-w-2xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {msgs.map((m) => {
          const mine = m.senderId === me;
          return (
            <div key={m.id} className={cn("flex gap-2 max-w-[80%]", mine ? "ml-auto flex-row-reverse" : "")}>
              {!mine && <Image src={m.senderImage || "/default-avatar.png"} alt="" width={28} height={28} className="rounded-full bg-zinc-800 self-end" />}
              <div className={cn("px-3 py-2 rounded-2xl text-sm", mine ? "bg-ig-accent text-white" : "bg-zinc-800")}>
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-ig-borderdark p-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message..." className="flex-1 bg-zinc-900 border border-ig-borderdark rounded-full px-4 py-2 text-sm" />
        <button className="text-ig-accent font-semibold"><Send className="w-5 h-5" /></button>
      </form>
    </div>
  );
}
