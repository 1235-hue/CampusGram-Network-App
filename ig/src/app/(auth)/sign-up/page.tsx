"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", username: "", name: "", password: "" });
  const [err, setErr] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-ig-borderdark rounded-lg p-8 bg-black">
        <h1 className="brand text-5xl text-center mb-2">CampusGram</h1>
        <p className="text-center text-ig-muted text-sm mb-6">Sign up to see photos from your campus.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await fetch("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
            if (!r.ok) { setErr((await r.json()).error ?? "Failed"); return; }
            router.push("/sign-in");
          }}
          className="space-y-2"
        >
          {["email", "username", "name", "password"].map((k) => (
            <input
              key={k}
              type={k === "password" ? "password" : "text"}
              placeholder={k[0].toUpperCase() + k.slice(1)}
              className="w-full bg-zinc-900 border border-ig-borderdark rounded px-3 py-2 text-sm"
              value={(form as any)[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            />
          ))}
          <button className="w-full bg-ig-accent text-white font-semibold py-2 rounded">Sign up</button>
          {err && <p className="text-ig-danger text-xs text-center">{err}</p>}
        </form>
        <p className="text-center text-sm text-ig-muted mt-6">Have an account? <Link href="/sign-in" className="text-ig-accent">Log in</Link></p>
      </div>
    </div>
  );
}
