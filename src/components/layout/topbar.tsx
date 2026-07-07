import { MobileNav } from "./mobile-nav";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";

export function Topbar({ name, email }: { name: string; email: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-2">
        <MobileNav />
        <span className="text-sm font-semibold md:hidden">JIP-ATS</span>
      </div>

      <div className="flex items-center gap-1.5">
        <NotificationBell />
        <UserMenu name={name} email={email} />
      </div>
    </header>
  );
}
