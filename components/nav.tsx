"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Code2, FolderGit2, Home, NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";

const items = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/leetcode", label: "LeetCode", icon: Code2 },
  { href: "/projects", label: "Projects", icon: FolderGit2 },
  { href: "/daily", label: "Daily log", icon: NotebookPen },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-border">
        <BrandMark size={26} />
        <span className="text-sm font-semibold tracking-tight">Summer Tracker</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-surface2 text-fg" : "text-muted hover:bg-surface2 hover:text-fg"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center justify-between border-t border-border px-3 py-3">
        <span className="text-xs text-muted px-2">v0.1</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-border bg-surface md:hidden">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-[10px] font-medium",
              active ? "text-accent" : "text-muted"
            )}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
