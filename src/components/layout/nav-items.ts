import {
  BriefcaseIcon,
  LayoutDashboardIcon,
  PhoneCallIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboardIcon },
  { title: "Kandidaten", href: "/kandidaten", icon: UsersIcon },
  { title: "Vacatures", href: "/vacatures", icon: BriefcaseIcon },
  { title: "Contactmomenten", href: "/contactmomenten", icon: PhoneCallIcon },
  { title: "Instellingen", href: "/instellingen", icon: SettingsIcon },
];

export function isActiveNavItem(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
