"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";

import { navItems, isActiveNavItem } from "./nav-items";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <MenuIcon />
          <span className="sr-only">Menu openen</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-64 border-sidebar-border bg-sidebar text-sidebar-foreground [&>button]:text-sidebar-foreground"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3 text-sidebar-foreground">
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/15 text-sm font-bold">
              J
            </span>
            JIP-ATS
          </SheetTitle>
        </SheetHeader>

        <nav aria-label="Hoofdnavigatie" className="space-y-1 px-3 pb-6">
          {navItems.map((item) => {
            const active = isActiveNavItem(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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
      </SheetContent>
    </Sheet>
  );
}
