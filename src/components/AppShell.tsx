import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Compass, BookOpen, Calendar, User, LogOut, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "@/components/NotificationsBell";

type Profile = { username: string; full_name: string | null; avatar_url: string | null };

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("username, full_name, avatar_url").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data as Profile | null));
  }, [user]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const nav = [
    { to: "/", label: "Feed", icon: Home, exact: true },
    { to: "/explore", label: "Explore", icon: Compass },
    { to: "/courses", label: "Courses", icon: BookOpen },
    { to: "/events", label: "Events", icon: Calendar },
    { to: profile ? `/profile/${profile.username}` : "/", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-paper px-4 py-6 md:flex">
          <Link to="/" className="mb-8 flex items-center gap-2 px-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-display text-2xl font-semibold tracking-tight">CampusGram</span>
          </Link>
          <nav className="flex flex-col gap-1">
            {nav.map((n) => {
              const active = n.exact ? path === n.to : path.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.label}
                  to={n.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-2">
            <NotificationsBell />
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
            className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </aside>

        {/* Mobile top bar */}
        <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-border bg-paper/95 px-4 py-3 backdrop-blur md:hidden">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-crimson" />
            <span className="font-display text-xl font-semibold">CampusGram</span>
          </Link>
          <NotificationsBell compact />
        </div>

        <main className="flex-1 px-4 pb-24 pt-16 md:px-8 md:pt-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-paper/95 py-2 backdrop-blur md:hidden">
        {nav.map((n) => {
          const active = n.exact ? path === n.to : path.startsWith(n.to);
          const Icon = n.icon;
          return (
            <Link key={n.label} to={n.to} className={cn("flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5", active ? "text-crimson" : "text-muted-foreground")}>
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
