import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/events/")({
  head: () => ({ meta: [{ title: "Events · CampusGram" }] }),
  component: Events,
});

type Event = {
  id: string; title: string; description: string | null; location: string | null;
  starts_at: string; ends_at: string | null; created_by: string;
};

function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [creating, setCreating] = useState(false);

  async function load() {
    const { data } = await supabase.from("events").select("*").gte("starts_at", new Date(Date.now() - 86400000).toISOString()).order("starts_at");
    setEvents((data as Event[]) ?? []);
  }
  useEffect(() => { void load(); }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold">Campus events</h1>
            <p className="text-sm text-muted-foreground">What's on around campus.</p>
          </div>
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> Create event
          </button>
        </header>

        {creating && <CreateEvent onDone={() => { setCreating(false); void load(); }} />}

        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((e) => {
            const d = new Date(e.starts_at);
            return (
              <Link key={e.id} to="/events/$id" params={{ id: e.id }} className="block rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
                <div className="flex gap-4">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-crimson text-crimson-foreground">
                    <span className="text-[10px] font-bold uppercase">{d.toLocaleString("en", { month: "short" })}</span>
                    <span className="font-display text-2xl font-semibold leading-none">{d.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-lg font-semibold">{e.title}</h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" /> {d.toLocaleString("en", { hour: "numeric", minute: "2-digit" })}
                    </div>
                    {e.location && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {e.location}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
          {events.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No upcoming events. Create one!
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function CreateEvent({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("events").insert({
      created_by: user.id, title, description: description || null, location: location || null,
      starts_at: new Date(startsAt).toISOString(),
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Event created"); onDone(); }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input required type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent">Cancel</button>
        <button type="submit" disabled={busy} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Create</button>
      </div>
    </form>
  );
}
