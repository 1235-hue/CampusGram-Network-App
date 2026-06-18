import "./globals.css";
import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "CampusGram",
  description: "Share moments with your campus.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="en" className="dark">
      <body className="bg-ig-bgdark text-ig-textdark min-h-screen">
        <div className="flex">
          {session?.user && <Nav user={session.user as any} />}
          <main className="flex-1 md:ml-64 pb-16 md:pb-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
