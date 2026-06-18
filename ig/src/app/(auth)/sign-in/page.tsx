"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-ig-borderdark rounded-lg p-8 bg-black">
        <h1 className="brand text-5xl text-center mb-8">CampusGram</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await signIn("credentials", { email, password, redirect: false });
            if (r?.error) setErr("Invalid email or password");
            else window.location.href = "/";
          }}
          className="space-y-2"
        >
          <input className="w-full bg-zinc-900 border border-ig-borderdark rounded px-3 py-2 text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" className="w-full bg-zinc-900 border border-ig-borderdark rounded px-3 py-2 text-sm" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="w-full bg-ig-accent text-white font-semibold py-2 rounded">Log in</button>
          {err && <p className="text-ig-danger text-xs text-center">{err}</p>}
        </form>
        <div className="my-4 flex items-center gap-2 text-xs text-ig-muted"><div className="flex-1 h-px bg-ig-borderdark"/>OR<div className="flex-1 h-px bg-ig-borderdark"/></div>
        <button onClick={() => signIn("google", { callbackUrl: "/" })} className="w-full border border-ig-borderdark rounded py-2 text-sm font-medium">Continue with Google</button>
        <p className="text-center text-sm text-ig-muted mt-6">Don't have an account? <Link href="/sign-up" className="text-ig-accent">Sign up</Link></p>
      </div>
    </div>
  );
}
