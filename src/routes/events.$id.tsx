import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, MapPin } from "lucide-react";

export const Route = createFileRoute("/events/$id")({
  head: () => ({ meta: [{ title: "Event · CampusGram" }] }),
  component: EventPage,
});

type Event = {
  id: string; title: string; description: string | null; location: string | null;
  starts_at: string; ends_at: string | null; created_by: string;
};
type Rsvp = { user_id: string; status: "going" | "interested" | "declined"; profile: { username: string; full_name: string | null; avatar_url: string | null } | null };

function EventPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [myStatus, setMyStatus] = useState<Rsvp["status"] | null>(null);

  const load = useCallback(async () => {
    const { data: e } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
    setEvent(e as Event | null);
    const { data: r } = await supabase
      .from("event_rsvps")
      .select("user_id, status, profile:profiles!event_rsvps_user_id_fkey(username, full_name, avatar_url)")
      .eq("event_id", id);
    setRsvps((r as never) ?? []);
    setMyStatus(((r as Rsvp[]) ?? []).find((x) => x.user_id === user?.id)?.status ?? null);
  }, [id, user]);

  useEffect(() => { void load(); }, [load]);

  async function setStatus(status: Rsvp["status"]) {
    if (!user) return;
    await supabase.from("event_rsvps").upsert({ event_id: id, user_id: user.id, status });
    void load();
  }

  if (!event) return <AppShell><p className="text-center text-muted-foreground">Loading…</p></AppShell>;

  const going = rsvps.filter((r) => r.status === "going");
  const d = new Date(event.starts_at);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex gap-5">
            <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-crimson text-crimson-foreground">
              <span className="text-xs font-bold uppercase">{d.toLocaleString("en", { month: "short" })}</span>
              <span className="font-display text-3xl font-semibold leading-none">{d.getDate()}</span>
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl font-semibold">{event.title}</h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {d.toLocaleString("en", { weekday: "long", hour: "numeric", minute: "2-digit" })}</span>
                {event.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.location}</span>}
              </div>
            </div>
          </div>
          {event.description && <p className="mt-4 whitespace-pre-wrap text-sm">{event.description}</p>}

          <div className="mt-5 flex gap-2 border-t border-border pt-4">
            {(["going", "interested", "declined"] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={
                  myStatus === s
                    ? "flex-1 rounded-full bg-crimson py-2 text-sm font-semibold text-crimson-foreground"
                    : "flex-1 rounded-full border border-input py-2 text-sm font-medium hover:bg-accent"
                }>
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <h2 className="font-display text-xl font-semibold">Going ({going.length})</h2>
        <div className="flex flex-wrap gap-3">
          {going.map((r) => (
            <div key={r.user_id} className="flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-3">
              <Avatar src={r.profile?.avatar_url} name={r.profile?.full_name ?? r.profile?.username} size={28} />
              <span className="text-sm">{r.profile?.full_name || r.profile?.username}</span>
            </div>
          ))}
          {going.length === 0 && <p className="text-sm text-muted-foreground">No one has RSVPed yet.</p>}
        </div>
      </div>
    </AppShell>
  );
}
