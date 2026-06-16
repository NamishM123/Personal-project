import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Nav, MobileNav } from "@/components/nav";
import { AuthGate } from "@/components/auth-gate";
import { QuickAdd } from "@/components/quick-add";

export const metadata: Metadata = {
  title: "Summer Tracker",
  description: "Jobs, LeetCode, projects, and how you spend your summer.",
};

// Every page in this app is user-specific; skip prerender so the build
// doesn't try to statically render Supabase-authed routes.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-bg text-fg font-sans">
        <AuthGate>
          <div className="flex min-h-[100dvh]">
            <Nav />
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
          </div>
          <QuickAdd />
          <MobileNav />
        </AuthGate>
      </body>
    </html>
  );
}
