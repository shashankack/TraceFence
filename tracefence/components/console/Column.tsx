import type { ReactNode } from "react";

/** Column inside the console workspace: a header row and a body, separated by a hairline. */
export function Column({
  index,
  title,
  meta,
  children,
  footer,
  className = "",
}: {
  index: string;
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex min-h-[520px] min-w-0 flex-col xl:min-h-0 ${className}`}>
      <header className="flex h-10 flex-none items-center gap-2.5 border-b border-line px-4">
        <span className="font-mono text-[10.5px] text-faint">{index}</span>
        <h2 className="m-0 text-[13px] font-semibold text-ink">{title}</h2>
        <div className="ml-auto flex items-center gap-2">{meta}</div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {footer && <footer className="flex h-8 flex-none items-center gap-1.5 border-t border-line px-4 text-[11.5px] text-faint">{footer}</footer>}
    </section>
  );
}
