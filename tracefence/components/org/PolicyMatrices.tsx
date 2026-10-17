"use client";

import { AnimatePresence, motion } from "motion/react";
import { CLASSIFICATIONS, ROLES, TOOLS, type Decision, type OrgPolicyDTO, type Role } from "@/components/api/types";
import { ROLE_LABEL } from "@/components/console/catalog";
import { Icon } from "@/components/ui/Icon";
import { panelVariants } from "./motion";

const CELL_TONE: Record<Decision, string> = {
  ALLOW: "text-allow bg-allow-soft border-allow/35",
  DENY: "text-deny bg-deny-soft border-deny/35",
  REQUIRE_APPROVAL: "text-approval bg-approval-soft border-approval/40",
};

const NEXT: Record<Decision, Decision> = { ALLOW: "DENY", DENY: "REQUIRE_APPROVAL", REQUIRE_APPROVAL: "ALLOW" };

export function PolicyMatrices({
  policy,
  canEdit,
  onChange,
}: {
  policy: OrgPolicyDTO;
  canEdit: boolean;
  onChange: (next: OrgPolicyDTO) => void;
}) {
  const toggleCollection = (role: Role, collection: string) => {
    const current = policy.roles[role].collections;
    const collections = current.includes(collection) ? current.filter((c) => c !== collection) : [...current, collection];
    onChange({ ...policy, roles: { ...policy.roles, [role]: { ...policy.roles[role], collections } } });
  };

  const cycleTool = (role: Role, tool: string) => {
    const value = policy.roles[role].tools[tool] ?? "DENY";
    onChange({
      ...policy,
      roles: { ...policy.roles, [role]: { ...policy.roles[role], tools: { ...policy.roles[role].tools, [tool]: NEXT[value] } } },
    });
  };

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
      <Panel icon="sliders" subtitle="Roles × collections — enforced before retrieval" title="Retrieval ACL">
        <Matrix columns={CLASSIFICATIONS}>
          {ROLES.map((role) => (
            <Row key={role} label={ROLE_LABEL[role]}>
              {CLASSIFICATIONS.map((c) => (
                <Cell
                  disabled={!canEdit}
                  key={c}
                  label={`${ROLE_LABEL[role]} reads ${c}`}
                  onClick={() => toggleCollection(role, c)}
                  value={policy.roles[role].collections.includes(c) ? "ALLOW" : "DENY"}
                />
              ))}
            </Row>
          ))}
        </Matrix>
      </Panel>

      <Panel icon="lock" subtitle="Roles × tools — click a cell to cycle" title="Tool gateway">
        <Matrix columns={TOOLS} wide>
          {ROLES.map((role) => (
            <Row key={role} label={ROLE_LABEL[role]} wide>
              {TOOLS.map((t) => (
                <Cell
                  disabled={!canEdit}
                  key={t}
                  label={`${ROLE_LABEL[role]} ${t}`}
                  onClick={() => cycleTool(role, t)}
                  value={policy.roles[role].tools[t] ?? "DENY"}
                />
              ))}
            </Row>
          ))}
        </Matrix>
      </Panel>
    </div>
  );
}

function Panel({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: "sliders" | "lock"; children: React.ReactNode }) {
  return (
    <motion.section
      className="panel overflow-hidden"
      variants={panelVariants}
    >
      <div className="flex h-11 items-center justify-between border-b border-line px-4">
        <div>
          <h2 className="m-0 inline text-[13px] font-semibold">{title}</h2>
          <p className="m-0 ml-3 inline text-[12px] text-faint">{subtitle}</p>
        </div>
        <Icon className="text-faint" name={icon} size={14} />
      </div>
      <div className="overflow-x-auto px-2.5 pt-2 pb-3">{children}</div>
    </motion.section>
  );
}

function Matrix({ columns, wide, children }: { columns: readonly string[]; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "min-w-[580px]" : ""}>
      <div
        className={`grid min-h-[32px] items-center gap-1.5 text-[11px] font-medium text-faint ${wide ? "grid-cols-[.85fr_repeat(5,1fr)]" : "grid-cols-[.7fr_repeat(3,1fr)]"}`}
      >
        <span>Role</span>
        {columns.map((c) => (
          <span className="truncate" key={c} title={c}>
            {c}
          </span>
        ))}
      </div>
      {children}
    </div>
  );
}

function Row({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`grid min-h-[40px] items-center gap-1.5 border-b border-line-soft py-1 text-[13px] last:border-b-0 ${wide ? "grid-cols-[.85fr_repeat(5,1fr)]" : "grid-cols-[.7fr_repeat(3,1fr)]"}`}
    >
      <span className="font-medium">{label}</span>
      {children}
    </div>
  );
}

function Cell({ value, onClick, disabled, label }: { value: Decision; onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <motion.button
      aria-label={`${label}: ${value}`}
      className={`relative h-7 overflow-hidden rounded-[3px] border font-mono text-[10.5px] font-medium transition-colors hover:brightness-95 disabled:cursor-not-allowed ${CELL_TONE[value]}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
      
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          animate={{ y: 0, opacity: 1 }}
          className="block"
          exit={{ y: -14, opacity: 0 }}
          initial={{ y: 14, opacity: 0 }}
          key={value}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {value === "REQUIRE_APPROVAL" ? "APPROVAL" : value}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
