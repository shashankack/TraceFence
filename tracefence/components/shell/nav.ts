import type { IconName } from "@/components/ui/Icon";

export const NAV: Array<{ href: string; label: string; icon: IconName; title: string; key: string }> = [
  { href: "/", label: "Console", icon: "console", title: "Console", key: "1" },
  { href: "/org", label: "Org / Admin", icon: "building", title: "Sources & policies", key: "2" },
  { href: "/audit", label: "Audit", icon: "chart", title: "Audit report", key: "3" },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
