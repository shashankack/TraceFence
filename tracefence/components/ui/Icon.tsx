import type { ReactNode } from "react";

export type IconName =
  | "shield"
  | "spark"
  | "send"
  | "book"
  | "filter"
  | "search"
  | "file"
  | "export"
  | "check"
  | "x"
  | "clock"
  | "lock"
  | "chevron"
  | "download"
  | "user"
  | "upload"
  | "sliders"
  | "megaphone"
  | "mail"
  | "refresh";

const paths: Record<IconName, ReactNode> = {
  shield: (
    <>
      <path d="M12 2.8 4.8 6v5.2c0 4.7 2.9 8.3 7.2 10.2 4.3-1.9 7.2-5.5 7.2-10.2V6L12 2.8Z" />
      <path d="m8.7 12 2.1 2.1 4.7-4.7" />
    </>
  ),
  spark: (
    <path d="m12 3 1.3 4.3L17 9l-3.7 1.7L12 15l-1.3-4.3L7 9l3.7-1.7L12 3Zm6 11 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />
  ),
  send: (
    <>
      <path d="m3.5 11.5 17-8-6.8 17-2.2-7-8-2Z" />
      <path d="m11.5 13.5 4-4" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22V5.5Z" />
      <path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22V5.5Z" />
    </>
  ),
  filter: <path d="M4 5h16M7 12h10m-7 7h4" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4.5 4.5" />
    </>
  ),
  file: (
    <>
      <path d="M6 3h8l4 4v14H6V3Z" />
      <path d="M14 3v5h5M9 13h6m-6 4h6" />
    </>
  ),
  export: (
    <>
      <path d="M12 3v12m-4-4 4 4 4-4" />
      <path d="M5 14v7h14v-7" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  x: <path d="m7 7 10 10M17 7 7 17" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  chevron: <path d="m9 6 6 6-6 6" />,
  download: <path d="M12 3v12m-4-4 4 4 4-4M5 20h14" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  upload: <path d="M12 21V9m-4 4 4-4 4 4M5 4h14" />,
  sliders: <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" />,
  megaphone: (
    <>
      <path d="M3 10v4h3l7 5V5L6 10H3Z" />
      <path d="M17 9a4 4 0 0 1 0 6" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </>
  ),
  refresh: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />,
};

export function Icon({ name, size = 16, className = "" }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`inline-block flex-none ${className}`}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  );
}

export function toolIcon(tool?: string | null): IconName {
  switch (tool) {
    case "search_docs":
      return "search";
    case "export_records":
      return "export";
    case "post_announcement":
      return "megaphone";
    case "notify_external":
      return "mail";
    default:
      return "file";
  }
}
