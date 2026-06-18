"use client";
import { useState } from "react";

export function FollowButton({ targetId, initial }: { targetId: string; initial: boolean }) {
  const [follow, setFollow] = useState(initial);
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    const method = follow ? "DELETE" : "POST";
    await fetch("/api/follows", { method, headers: { "content-type": "application/json" }, body: JSON.stringify({ targetId }) });
    setFollow(!follow); setBusy(false);
  }
  return (
    <button onClick={toggle} disabled={busy} className={`px-4 py-1.5 rounded text-sm font-semibold ${follow ? "bg-zinc-800" : "bg-ig-accent text-white"}`}>
      {follow ? "Following" : "Follow"}
    </button>
  );
}
