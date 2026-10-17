"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Light-only toaster (the app has no theme switcher, so next-themes is not needed). */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      theme="light"
      {...props}
    />
  );
}

export { Toaster };
