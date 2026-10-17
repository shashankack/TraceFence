"use client";

import { AnimatePresence, motion } from "motion/react";
import { ROLES, type Role } from "@/components/api/types";
import { useAppState } from "@/components/shell/AppState";
import { Icon } from "@/components/ui/Icon";
import { ROLE_LABEL } from "./catalog";

export const DEMO_PROMPTS = {
  curfew: "What time is hostel curfew on weekdays, and are there exceptions?",
  export: "Export every student email address from the directory as a CSV.",
};

export function RoleSelector({ layoutGroup = "console" }: { layoutGroup?: string }) {
  const { role, setRole, session, send, clear, sending, messages } = useAppState();

  return (
    <section className="mx-auto flex min-h-[61px] max-w-[1410px] flex-wrap items-center justify-between gap-3 border-b border-line px-[22px] py-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[10px] font-bold uppercase tracking-[.65px] text-faint">Demo role</span>
        <RoleTabs layoutGroup={layoutGroup} onChange={setRole} value={role} />
        <div className="flex items-center gap-1.5 pl-1 text-xs text-muted">
          <span className="grid size-[22px] place-items-center rounded-full border border-[#c6dfda] bg-teal-soft text-teal">
            <Icon name="user" size={12} />
          </span>
          <b className="text-[#354448]">{ROLE_LABEL[role]}</b>
          <AnimatePresence mode="wait">
            <motion.code
              animate={{ opacity: 1, x: 0 }}
              className="border-l border-line-strong pl-2 font-mono text-[11px] text-faint"
              exit={{ opacity: 0, x: 6 }}
              initial={{ opacity: 0, x: -6 }}
              key={session?.sessionId ?? "pending"}
            >
              {session?.sessionId ?? "starting session…"}
            </motion.code>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[.65px] text-faint">Demo path</span>
        <PathButton disabled={sending} icon="book" label="Curfew answer" onClick={() => send(DEMO_PROMPTS.curfew)} />
        <PathButton danger disabled={sending} icon="export" label="Directory export" onClick={() => send(DEMO_PROMPTS.export)} />
        <PathButton disabled={sending || messages.length === 0} label="Clear" onClick={clear} />
      </div>
    </section>
  );
}

export function RoleTabs({ value, onChange, layoutGroup }: { value: Role; onChange: (r: Role) => void; layoutGroup: string }) {
  return (
    <div className="flex gap-[3px] rounded-lg bg-surface-soft p-[3px]" role="tablist">
      {ROLES.map((r) => (
        <button
          aria-selected={value === r}
          className={`relative rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${value === r ? "text-teal" : "text-muted hover:text-ink"}`}
          key={r}
          onClick={() => onChange(r)}
          role="tab"
          type="button"
        >
          {value === r && (
            <motion.span
              className="absolute inset-0 rounded-md bg-surface shadow-[0_1px_3px_rgba(18,22,28,.08)]"
              layoutId={`role-pill-${layoutGroup}`}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative">{ROLE_LABEL[r]}</span>
        </button>
      ))}
    </div>
  );
}

function PathButton({
  icon,
  label,
  onClick,
  danger,
  disabled,
}: {
  icon?: "book" | "export";
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      className={`flex h-[30px] items-center gap-1.5 rounded-[7px] border border-line bg-white/70 px-2.5 text-xs font-bold text-muted transition-colors disabled:opacity-50 ${danger ? "hover:border-[#e8b5b5] hover:text-deny" : "hover:border-[#a8d2cb] hover:text-teal"} hover:bg-white`}
      disabled={disabled}
      onClick={onClick}
      type="button"
      whileTap={{ scale: 0.96 }}
    >
      {icon && <Icon name={icon} size={13} />}
      {label}
    </motion.button>
  );
}
