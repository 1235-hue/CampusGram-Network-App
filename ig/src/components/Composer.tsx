"use client";
import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

export function Composer() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function submit() {
    if (!files.length) return;
    setBusy(true);
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    fd.append("caption", caption);
    const r = await fetch("/api/posts", { method: "POST", body: fd });
    setBusy(false);
    if (r.ok) { setFiles([]); setCaption(""); setOpen(false); location.reload(); }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="w-full border border-ig-borderdark rounded-lg p-3 text-sm text-ig-muted text-left flex items-center gap-2 hover:bg-zinc-900">
      <ImagePlus className="w-5 h-5" /> Share something with your campus...
    </button>
  );

  return (
    <div className="border border-ig-borderdark rounded-lg p-3 bg-zinc-950 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">New post</span>
        <button onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
      </div>
      <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
      <button onClick={() => fileRef.current?.click()} className="w-full border border-dashed border-ig-borderdark rounded p-6 text-sm text-ig-muted hover:bg-zinc-900">
        {files.length ? `${files.length} file(s) selected` : "Tap to select photos/videos"}
      </button>
      <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption..." className="w-full bg-zinc-900 border border-ig-borderdark rounded p-2 text-sm min-h-[80px]" />
      <button disabled={busy || !files.length} onClick={submit} className="w-full bg-ig-accent text-white font-semibold py-2 rounded disabled:opacity-50">
        {busy ? "Sharing..." : "Share"}
      </button>
    </div>
  );
}
