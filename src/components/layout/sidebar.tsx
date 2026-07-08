"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItems, isActiveNavItem } from "./nav-items";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-white/15 text-sm font-bold">
          J
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">JIP-ATS</p>
          <p className="text-[0.72rem] text-sidebar-muted">Jump Into People</p>
        </div>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = isActiveNavItem(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-active text-white"
                  : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="size-4.5 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-[0.72rem] text-sidebar-muted">
          Fase 1 · Fundament
        </p>
      </div>
    </aside>
  );
}
