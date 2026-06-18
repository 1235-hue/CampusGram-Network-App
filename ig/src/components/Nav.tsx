"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Home, Search, Film, Send, Heart, PlusSquare, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function Nav({ user }: { user: { id: string; name?: string | null; image?: string | null; email?: string | null } }) {
  const path = usePathname();
  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Search },
    { href: "/reels", label: "Reels", icon: Film },
    { href: "/direct", label: "Messages", icon: Send },
    { href: "/notifications", label: "Notifications", icon: Heart },
    { href: "/create", label: "Create", icon: PlusSquare },
    { href: `/${user.email?.split("@")[0]}`, label: "Profile", icon: User },
  ];
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 w-64 h-screen border-r border-ig-borderdark p-4 flex-col bg-black">
        <Link href="/" className="brand text-3xl px-2 py-6">CampusGram</Link>
        <nav className="flex-1 space-y-1 mt-4">
          {items.map((i) => {
            const Icon = i.icon;
            const active = path === i.href;
            return (
              <Link key={i.href} href={i.href} className={cn("flex items-center gap-4 px-2 py-3 rounded-lg hover:bg-zinc-900", active && "font-bold")}>
                <Icon className={cn("w-6 h-6", active && "stroke-[2.5]")} />
                <span>{i.label}</span>
              </Link>
            );
          })}
        </nav>
        <button onClick={() => signOut({ callbackUrl: "/sign-in" })} className="flex items-center gap-4 px-2 py-3 rounded-lg hover:bg-zinc-900 text-sm">
          <LogOut className="w-5 h-5" /> Sign out
        </button>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 border-t border-ig-borderdark bg-black flex justify-around items-center z-50">
        {items.slice(0, 5).map((i) => {
          const Icon = i.icon;
          return (
            <Link key={i.href} href={i.href} className="p-2">
              <Icon className={cn("w-6 h-6", path === i.href && "stroke-[2.5]")} />
            </Link>
          );
        })}
      </nav>
      {/* Mobile top header */}
      <header className="md:hidden sticky top-0 z-40 h-12 flex items-center justify-between px-4 bg-black border-b border-ig-borderdark">
        <Link href="/" className="brand text-2xl">CampusGram</Link>
        <Link href="/direct"><Send className="w-6 h-6" /></Link>
      </header>
    </>
  );
}
