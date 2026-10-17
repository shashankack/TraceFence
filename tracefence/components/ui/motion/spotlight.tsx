"use client";

import { useReducedMotion } from "motion/react";
import {
  useCallback,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cn } from "@/components/lib/utils";

type SpotlightTone = "primary" | "soft" | "brand";

const TONE: Record<SpotlightTone, string> = {
  primary: "color-mix(in oklab, var(--primary) 22%, transparent)",
  soft: "color-mix(in oklab, var(--primary) 12%, transparent)",
  brand: "rgba(255,255,255,0.22)",
};

/** Pointer handlers + CSS vars for a cursor-tracking flash on hover. */
export function useSpotlight(opts?: {
  size?: number;
  disabled?: boolean;
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(false);
  const disabled = !!opts?.disabled || !!reduce;
  const size = opts?.size ?? 260;

  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (disabled) return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
      el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
      el.style.setProperty("--spot-size", `${size}px`);
      setActive(true);
    },
    [disabled, size],
  );

  const onMouseLeave = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (disabled) return;
      setActive(false);
      e.currentTarget.style.removeProperty("--spot-x");
      e.currentTarget.style.removeProperty("--spot-y");
    },
    [disabled],
  );

  return {
    active,
    disabled,
    spotlightProps: {
      onMouseMove: disabled ? undefined : onMouseMove,
      onMouseLeave: disabled ? undefined : onMouseLeave,
      "data-spotlight": disabled ? undefined : active ? "on" : "off",
      className: disabled ? undefined : "tf-spotlight",
    } as const,
  };
}

/**
 * Wrap any surface (card, tile, button chrome) so a soft radial flash follows the cursor.
 */
export function Spotlight({
  children,
  className,
  tone = "soft",
  size = 280,
  as: Comp = "div",
  disabled,
  style,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  tone?: SpotlightTone;
  size?: number;
  as?: "div" | "section" | "article" | "span";
  disabled?: boolean;
  style?: CSSProperties;
} & Record<string, unknown>) {
  const { spotlightProps } = useSpotlight({ size, disabled });
  return (
    <Comp
      {...rest}
      {...spotlightProps}
      className={cn(spotlightProps.className, className)}
      style={
        {
          ...style,
          ["--spot-color" as string]: TONE[tone],
          ["--spot-size" as string]: `${size}px`,
        } as CSSProperties
      }
    >
      {children}
    </Comp>
  );
}
