import "./globals.css";
import type { Metadata } from "next";
import { Nav, MobileNav } from "@/components/nav";
import { AuthGate } from "@/components/auth-gate";
import { QuickAdd } from "@/components/quick-add";

export const metadata: Metadata = {
  title: "Summer Tracker",
  description: "Track jobs, LeetCode, projects, and how you spend your summer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          // Avoid theme flash by setting the class before paint.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-bg text-fg">
        <AuthGate>
          <div className="flex min-h-screen">
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
