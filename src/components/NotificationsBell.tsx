import { useEffect, useState } from "react";
import { Bell, Heart, MessageCircle, UserPlus, Calendar, BookOpen } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Notif = {
  id: string;
  type: "like" | "comment" | "follow" | "rsvp" | "course_update";
  actor_id: string | null;
  post_id: string | null;
  comment_id: string | null;
  event_id: string | null;
  course_id: string | null;
  message: string | null;
  read: boolean;
  created_at: string;
  actor?: { username: string; full_name: string | null; avatar_url: string | null } | null;
};

const ICONS = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  rsvp: Calendar,
  course_update: BookOpen,
};

function describe(n: Notif) {
  const who = n.actor?.full_name || n.actor?.username || "Someone";
  switch (n.type) {
    case "like": return `${who} liked your post`;
    case "comment": return `${who} commented on your post`;
    case "follow": return `${who} started following you`;
    case "rsvp": return `${who} RSVP'd to your event`;
    case "course_update": return n.message ?? "A course you joined was updated";
  }
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function NotificationsBell({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, type, actor_id, post_id, comment_id, event_id, course_id, message, read, created_at, actor:profiles!notifications_actor_id_fkey(username, full_name, avatar_url)")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setItems(data as unknown as Notif[]);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` },
        (payload) => {
          load();
          const n = payload.new as Notif;
          toast(describe({ ...n, actor: null }), { description: "New notification" });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const unread = items.filter((i) => !i.read).length;

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    await supabase.from("notifications").update({ read: true }).eq("recipient_id", user.id).eq("read", false);
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  };

  const onClickItem = async (n: Notif) => {
    if (!n.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
    }
    setOpen(false);
    if (n.type === "follow" && n.actor?.username) navigate({ to: "/profile/$username", params: { username: n.actor.username } });
    else if (n.event_id) navigate({ to: "/events/$id", params: { id: n.event_id } });
    else if (n.course_id) navigate({ to: "/courses/$id", params: { id: n.course_id } });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Notifications"
          className={cn(
            "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent",
            compact && "p-2"
          )}
        >
          <Bell className="h-5 w-5" />
          {!compact && <span>Notifications</span>}
          {unread > 0 && (
            <span className="absolute right-2 top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-crimson px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-display text-base font-semibold">Notifications</h3>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs font-medium text-crimson hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">No notifications yet</div>
          ) : (
            items.map((n) => {
              const Icon = ICONS[n.type];
              return (
                <button
                  key={n.id}
                  onClick={() => onClickItem(n)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent",
                    !n.read && "bg-accent/40"
                  )}
                >
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug text-foreground">{describe(n)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.created_at)} ago</p>
                  </div>
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-crimson" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
