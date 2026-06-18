import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in · CampusGram" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (cleanUsername.length < 3) throw new Error("Username must be at least 3 characters (letters, numbers, _)");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: cleanUsername, full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        toast.success("Welcome to CampusGram!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Hero / brand panel */}
      <div className="relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground md:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-crimson text-crimson-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="font-display text-2xl font-semibold">CampusGram</span>
        </div>
        <div className="space-y-6">
          <h1 className="font-display text-5xl font-semibold leading-tight">
            Your campus,<br />
            <span className="italic text-crimson">connected.</span>
          </h1>
          <p className="max-w-md text-lg text-primary-foreground/80">
            One place for the people, classes, clubs, and events that shape your time at university.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-6">
            {[
              { n: "12k+", l: "students" },
              { n: "340", l: "courses" },
              { n: "1.2k", l: "events" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-primary-foreground/15 p-4">
                <div className="font-display text-2xl font-semibold">{s.n}</div>
                <div className="text-xs uppercase tracking-wider text-primary-foreground/60">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-primary-foreground/60">© CampusGram</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <GraduationCap className="h-6 w-6 text-crimson" />
            <span className="font-display text-2xl font-semibold">CampusGram</span>
          </div>
          <h2 className="font-display text-3xl font-semibold">
            {mode === "signin" ? "Welcome back" : "Join your campus"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to continue." : "Create your CampusGram account."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            {mode === "signup" && (
              <>
                <Field label="Full name" value={fullName} onChange={setFullName} required />
                <Field label="Username" value={username} onChange={setUsername} required placeholder="jane_doe" />
              </>
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} required />
            <Field label="Password" type="password" value={password} onChange={setPassword} required minLength={6} />
            <button
              type="submit"
              disabled={busy}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-crimson px-4 py-3 text-sm font-semibold text-crimson-foreground transition-opacity disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-crimson hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, placeholder, minLength,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string; minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        minLength={minLength}
        className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-crimson focus:ring-2 focus:ring-crimson/20"
      />
    </label>
  );
}
