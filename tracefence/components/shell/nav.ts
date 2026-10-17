import type { IconName } from "@/components/ui/Icon";

export const NAV: Array<{ href: string; label: string; icon: IconName; caption: string }> = [
  { href: "/", label: "Console", icon: "console", caption: "Mission control · live trace" },
  { href: "/org", label: "Org / Admin", icon: "building", caption: "Sources & policies" },
  { href: "/audit", label: "Audit", icon: "chart", caption: "Evidence & decisions" },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
