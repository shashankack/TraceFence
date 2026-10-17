"use client";

import {
  ArrowRight,
  Building2,
  Briefcase,
  Check,
  Globe2,
  GraduationCap,
  IdCard,
  Loader2,
  Mail,
  MapPin,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/components/api/client";
import type {
  CustomOrgRole,
  OrgMemberDTO,
  OrgProfileDTO,
  OrgType,
  Role,
  RoleLabels,
} from "@/components/api/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { RoleGate } from "@/components/auth/RoleGate";
import { cn } from "@/components/lib/utils";
import { ROLE_LABEL, roleLabelFor } from "@/components/shell/nav";
import { Badge } from "@/components/ui/badge";
import { BentoTile } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlurFade } from "@/components/ui/motion/blur-fade";
import { Stagger, StaggerItem } from "@/components/ui/motion/stagger";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const GATEWAY_ROLES: Role[] = ["guest", "student", "faculty", "admin"];

const ROLE_HINT: Record<string, string> = {
  guest: "Public sources only · no login",
  student: "Public corpus · exports denied",
  faculty: "Broader corpus · exports need approval",
  admin: "Full policy, approvals, and audit",
};

function emptyLabels(): RoleLabels {
  return { guest: "", student: "", faculty: "", admin: "" };
}

function labelsEqual(a: RoleLabels, b: RoleLabels | undefined): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b ?? {})]);
  for (const r of keys) {
    if ((a[r]?.trim() || "") !== (b?.[r]?.trim() || "")) return false;
  }
  return true;
}

const ORG_TYPES: Array<{
  value: OrgType;
  label: string;
  detail: string;
  icon: typeof GraduationCap;
  roles: string;
}> = [
  {
    value: "college",
    label: "College / university",
    detail:
      "Campus assistant, public + confidential corpus, student & faculty roles.",
    icon: GraduationCap,
    roles: "Guest · Student · Faculty · Admin",
  },
  {
    value: "small_business",
    label: "Small business",
    detail: "Same gateway roles, labeled Member / Manager in the product UI.",
    icon: Briefcase,
    roles: "Guest · Member · Manager · Admin",
  },
];

export default function OrganizationPage() {
  return (
    <RoleGate allow={["admin"]}>
      <Organization />
    </RoleGate>
  );
}

function Organization() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState<OrgProfileDTO | null>(null);
  const [name, setName] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [orgType, setOrgType] = useState<OrgType>("college");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [sizeBand, setSizeBand] = useState("");
  const [roleLabels, setRoleLabels] = useState<RoleLabels>(emptyLabels());
  const [customRoles, setCustomRoles] = useState<CustomOrgRole[]>([]);
  const [members, setMembers] = useState<OrgMemberDTO[]>([]);
  const [assignableRoles, setAssignableRoles] = useState<string[]>([]);
  const [newRoleLabel, setNewRoleLabel] = useState("");
  const [newRoleWorkspace, setNewRoleWorkspace] = useState<
    "student" | "faculty"
  >("student");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleBusy, setRoleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyProfile = (p: OrgProfileDTO) => {
    setProfile(p);
    setName(p.name);
    setNotifyEmail(p.notifyEmail ?? "");
    setOrgType(p.orgType);
    setWebsite(p.profile.website ?? "");
    setCity(p.profile.city ?? "");
    setSizeBand(p.profile.sizeBand ?? "");
    const labels: RoleLabels = {
      ...emptyLabels(),
      ...(p.profile.roleLabels ?? {}),
    };
    for (const cr of p.profile.customRoles ?? []) {
      if (!(cr.id in labels)) labels[cr.id] = cr.label;
    }
    setRoleLabels(labels);
    setCustomRoles(p.profile.customRoles ?? []);
  };

  const loadMembers = useCallback(async () => {
    const res = await api.orgMembers();
    setMembers(res.members);
    setAssignableRoles(res.assignableRoles);
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([api.orgProfile(), api.orgMembers()])
      .then(([p, m]) => {
        if (!alive) return;
        applyProfile(p);
        setMembers(m.members);
        setAssignableRoles(m.assignableRoles);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const dirty = useMemo(() => {
    if (!profile) return false;
    return (
      name.trim() !== profile.name ||
      (notifyEmail.trim() || "") !== (profile.notifyEmail ?? "") ||
      orgType !== profile.orgType ||
      (website.trim() || "") !== (profile.profile.website ?? "") ||
      (city.trim() || "") !== (profile.profile.city ?? "") ||
      (sizeBand.trim() || "") !== (profile.profile.sizeBand ?? "") ||
      !labelsEqual(roleLabels, profile.profile.roleLabels)
    );
  }, [
    profile,
    name,
    notifyEmail,
    orgType,
    website,
    city,
    sizeBand,
    roleLabels,
  ]);

  const discard = () => {
    if (!profile) return;
    applyProfile(profile);
    setError(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const cleaned: RoleLabels = {};
      const labelKeys = new Set([
        ...GATEWAY_ROLES,
        ...customRoles.map((c) => c.id),
      ]);
      for (const r of labelKeys) {
        const t = roleLabels[r]?.trim();
        if (t) cleaned[r] = t;
      }
      const next = await api.updateOrgProfile({
        name: name.trim(),
        notifyEmail: notifyEmail.trim() || null,
        orgType,
        profile: {
          website: website.trim() || undefined,
          city: city.trim() || undefined,
          sizeBand: sizeBand.trim() || undefined,
          roleLabels: cleaned,
        },
      });
      applyProfile(next);
      await refresh();
      toast.success("Organization profile saved", {
        description:
          "Role names apply across the console. Permissions stay on Sources & policies.",
      });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not save profile";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const addRole = async () => {
    const label = newRoleLabel.trim();
    if (!label) return;
    setRoleBusy(true);
    try {
      const { role } = await api.createOrgRole({
        label,
        workspace: newRoleWorkspace,
      });
      setCustomRoles((prev) => [...prev, role]);
      setRoleLabels((prev) => ({ ...prev, [role.id]: role.label }));
      setNewRoleLabel("");
      await loadMembers();
      await refresh();
      toast.success(`Added role “${role.label}”`, {
        description:
          "Seeded with student-level permissions  tune them under Sources & policies.",
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add role");
    } finally {
      setRoleBusy(false);
    }
  };

  const removeRole = async (id: string) => {
    setRoleBusy(true);
    try {
      await api.deleteOrgRole(id);
      setCustomRoles((prev) => prev.filter((r) => r.id !== id));
      setRoleLabels((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await loadMembers();
      await refresh();
      toast.success("Role removed");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not remove role",
      );
    } finally {
      setRoleBusy(false);
    }
  };

  const changeMemberRole = async (userId: string, role: string) => {
    try {
      await api.setOrgMemberRole(userId, role);
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role } : m)),
      );
      toast.success("Member role updated", {
        description:
          "They need to sign in again (or switch tenant) for the new role to take effect.",
      });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not update member",
      );
      await loadMembers();
    }
  };

  const typeMeta = ORG_TYPES.find((t) => t.value === orgType) ?? ORG_TYPES[0];
  const TypeIcon = typeMeta.icon;

  return (
    <main className="p-4 sm:p-6">
      <Stagger
        className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12"
        delay={0.04}
      >
        {/* Hero */}
        <StaggerItem className="md:col-span-6 xl:col-span-12">
          <BlurFade>
            <section className="relative overflow-hidden rounded-xl border bg-card px-5 py-5 sm:px-6 sm:py-6">
              <div className="pointer-events-none absolute inset-0 tech-grid opacity-40 [mask-image:radial-gradient(ellipse_at_0%_0%,black,transparent_65%)]" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="kicker m-0">Tenant settings</p>
                  {loading ? (
                    <Skeleton className="mt-2 h-8 w-64" />
                  ) : (
                    <>
                      <h1 className="mt-1 mb-0 truncate text-2xl font-semibold tracking-[-0.02em] sm:text-[28px]">
                        {name.trim() || "Organization"}
                      </h1>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <Badge
                          className="gap-1.5 font-normal"
                          variant="secondary"
                        >
                          <TypeIcon className="size-3" />
                          {typeMeta.label}
                        </Badge>
                        {profile && (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {profile.id}
                          </span>
                        )}
                        {user && (
                          <span className="text-[11px] text-muted-foreground">
                            Signed in as{" "}
                            {roleLabelFor(user.role, orgType, roleLabels)}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/approvals">Approvals inbox</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link href="/admin/policies">Sources & policies</Link>
                  </Button>
                </div>
              </div>
            </section>
          </BlurFade>
        </StaggerItem>

        {/* Identity */}
        <StaggerItem className="md:col-span-6 xl:col-span-7">
          <BentoTile
            className="h-full"
            icon={Building2}
            kicker="identity"
            title="Organization"
          >
            {loading ? (
              <Skeleton className="m-5 h-56" />
            ) : (
              <div className="flex flex-col gap-5 px-5 py-4">
                {error && <p className="m-0 text-sm text-deny">{error}</p>}
                <div className="grid gap-2">
                  <Label htmlFor="org-name">Display name</Label>
                  <Input
                    id="org-name"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="NullTrace Institute"
                    value={name}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Organization type</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ORG_TYPES.map((t) => {
                      const Icon = t.icon;
                      const selected = orgType === t.value;
                      return (
                        <button
                          className={cn(
                            "rounded-xl border px-3.5 py-3 text-left transition-colors",
                            selected
                              ? "border-primary/35 bg-accent/60 shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_20%,transparent)]"
                              : "border-border bg-white hover:bg-muted/40",
                          )}
                          key={t.value}
                          onClick={() => setOrgType(t.value)}
                          type="button"
                        >
                          <span className="flex items-start gap-2.5">
                            <span
                              className={cn(
                                "mt-0.5 grid size-8 place-items-center rounded-lg",
                                selected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              <Icon className="size-4" strokeWidth={1.8} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5">
                                <span className="text-sm font-medium">
                                  {t.label}
                                </span>
                                {selected && (
                                  <Check className="size-3.5 text-primary" />
                                )}
                              </span>
                              <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
                                {t.detail}
                              </span>
                              <span className="mt-1.5 block font-mono text-[10px] text-muted-foreground">
                                {t.roles}
                              </span>
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="m-0 text-xs text-muted-foreground">
                    Relabels roles in the product UI only. Gateway permissions
                    still use student / faculty / admin.
                  </p>
                </div>
              </div>
            )}
          </BentoTile>
        </StaggerItem>

        {/* Alerts */}
        <StaggerItem className="md:col-span-6 xl:col-span-5">
          <BentoTile
            className="h-full"
            icon={Mail}
            kicker="human checkpoints"
            title="Approval alerts"
          >
            {loading ? (
              <Skeleton className="m-5 h-40" />
            ) : (
              <div className="flex flex-col gap-4 px-5 py-4">
                <p className="m-0 text-sm leading-relaxed text-muted-foreground">
                  When the gateway pauses a tool for approval, TraceFence
                  records a mock email and shows it under Approvals →
                  Notifications. Optionally set an org-wide alert address.
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="notify">Notify email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      id="notify"
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      placeholder="security@your-org.example"
                      type="email"
                      value={notifyEmail}
                    />
                  </div>
                  <p className="m-0 text-xs text-muted-foreground">
                    Leave blank to rely on each admin membership inbox only.
                    Demo uses a mock outbox no real SMTP.
                  </p>
                </div>
                <div className="mt-auto rounded-lg border border-dashed bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                  Demo accounts:{" "}
                  <code className="font-mono text-[11px]">
                    admin@nulltrace.demo
                  </code>
                </div>
              </div>
            )}
          </BentoTile>
        </StaggerItem>

        {/* Roles */}
        <StaggerItem className="md:col-span-6 xl:col-span-7">
          <BentoTile
            action={
              <Button asChild size="sm" variant="ghost">
                <Link href="/admin/policies">
                  Edit permissions <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            }
            className="h-full"
            icon={IdCard}
            kicker="builtin + custom · gateway enforces by id"
            title="Organization roles"
          >
            {loading ? (
              <Skeleton className="m-5 h-56" />
            ) : (
              <div className="flex flex-col gap-5 px-5 py-4">
                <p className="m-0 text-sm leading-relaxed text-muted-foreground">
                  Rename the built-in roles, or add your own (e.g. RA,
                  Contractor). New roles get a policy row seeded like student
                  change what they may read and do under Sources &amp; policies.
                </p>
                <ul className="m-0 grid list-none gap-3 p-0">
                  {GATEWAY_ROLES.map((role) => {
                    const preview = roleLabelFor(role, orgType, roleLabels);
                    const placeholder = roleLabelFor(role, orgType, null);
                    return (
                      <li
                        className="grid gap-2 rounded-xl border bg-muted/20 px-3.5 py-3 sm:grid-cols-[7.5rem_1fr_auto] sm:items-center"
                        key={role}
                      >
                        <div className="min-w-0">
                          <p className="m-0 font-mono text-[11px] text-muted-foreground">
                            {role}
                          </p>
                          <p className="m-0 text-[11px] leading-snug text-muted-foreground">
                            {ROLE_HINT[role]}
                          </p>
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="sr-only" htmlFor={`role-${role}`}>
                            Label for {role}
                          </Label>
                          <Input
                            id={`role-${role}`}
                            maxLength={40}
                            onChange={(e) =>
                              setRoleLabels((prev) => ({
                                ...prev,
                                [role]: e.target.value,
                              }))
                            }
                            placeholder={placeholder}
                            value={roleLabels[role] ?? ""}
                          />
                        </div>
                        <Badge className="w-fit font-normal" variant="outline">
                          Shows as{" "}
                          {preview ||
                            ROLE_LABEL[role as keyof typeof ROLE_LABEL]}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>

                <div className="border-t pt-4">
                  <p className="kicker m-0 mb-3">Custom roles</p>
                  {customRoles.length === 0 ? (
                    <p className="m-0 mb-3 text-xs text-muted-foreground">
                      No custom roles yet. Add one below it becomes a real
                      gateway role id.
                    </p>
                  ) : (
                    <ul className="m-0 mb-3 grid list-none gap-2 p-0">
                      {customRoles.map((role) => (
                        <li
                          className="flex flex-wrap items-center gap-2 rounded-xl border px-3.5 py-2.5"
                          key={role.id}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="m-0 text-sm font-medium">
                              {role.label}
                            </p>
                            <p className="m-0 font-mono text-[11px] text-muted-foreground">
                              {role.id} · {role.workspace} workspace
                            </p>
                          </div>
                          <Input
                            className="max-w-[10rem]"
                            maxLength={40}
                            onChange={(e) =>
                              setRoleLabels((prev) => ({
                                ...prev,
                                [role.id]: e.target.value,
                              }))
                            }
                            placeholder={role.label}
                            value={roleLabels[role.id] ?? ""}
                          />
                          <Button
                            disabled={roleBusy}
                            onClick={() => void removeRole(role.id)}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="grid min-w-0 flex-1 gap-1.5">
                      <Label htmlFor="new-role">New role name</Label>
                      <Input
                        id="new-role"
                        maxLength={40}
                        onChange={(e) => setNewRoleLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void addRole();
                          }
                        }}
                        placeholder="Research assistant"
                        value={newRoleLabel}
                      />
                    </div>
                    <div className="grid w-full gap-1.5 sm:w-40">
                      <Label>Workspace</Label>
                      <Select
                        onValueChange={(v) =>
                          setNewRoleWorkspace(v as "student" | "faculty")
                        }
                        value={newRoleWorkspace}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student chat</SelectItem>
                          <SelectItem value="faculty">Faculty chat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className="sm:mb-0.5"
                      disabled={roleBusy || !newRoleLabel.trim()}
                      onClick={() => void addRole()}
                      size="sm"
                      type="button"
                    >
                      {roleBusy ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Plus className="size-3.5" />
                      )}
                      Add role
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </BentoTile>
        </StaggerItem>

        {/* Members */}
        <StaggerItem className="md:col-span-6 xl:col-span-5">
          <BentoTile
            className="h-full"
            icon={Users}
            kicker="memberships"
            title="Assign roles"
          >
            {loading ? (
              <Skeleton className="m-5 h-40" />
            ) : (
              <div className="flex flex-col gap-3 px-5 py-4">
                <p className="m-0 text-sm text-muted-foreground">
                  Map people to builtin or custom roles. Gateway auth uses the
                  role id on their next session.
                </p>
                <ul className="m-0 max-h-72 list-none space-y-2 overflow-y-auto p-0">
                  {members.map((m) => (
                    <li
                      className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/15 px-3 py-2"
                      key={m.userId}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-sm font-medium">
                          {m.displayName || m.email}
                        </p>
                        <p className="m-0 truncate font-mono text-[11px] text-muted-foreground">
                          {m.email}
                        </p>
                      </div>
                      <Select
                        onValueChange={(role) =>
                          void changeMemberRole(m.userId, role)
                        }
                        value={m.role}
                      >
                        <SelectTrigger className="w-[9.5rem]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {assignableRoles.map((r) => (
                            <SelectItem key={r} value={r}>
                              {roleLabelFor(r, orgType, roleLabels)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </BentoTile>
        </StaggerItem>

        {/* Profile details */}
        <StaggerItem className="md:col-span-6 xl:col-span-12">
          <BentoTile
            className="h-full"
            icon={Globe2}
            kicker="optional metadata"
            title="Profile details"
          >
            {loading ? (
              <Skeleton className="m-5 h-40" />
            ) : (
              <div className="grid gap-4 px-5 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      id="city"
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Bengaluru"
                      value={city}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="size">Size band</Label>
                  <div className="relative">
                    <Users className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      id="size"
                      onChange={(e) => setSizeBand(e.target.value)}
                      placeholder="50–200"
                      value={sizeBand}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="web">Website</Label>
                  <div className="relative">
                    <Globe2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      id="web"
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://"
                      value={website}
                    />
                  </div>
                </div>
              </div>
            )}
          </BentoTile>
        </StaggerItem>
      </Stagger>

      {/* Sticky save bar */}
      {!loading && (
        <div
          className={cn(
            "sticky bottom-4 z-10 mt-4 flex items-center justify-between gap-3 rounded-xl border bg-white/95 px-4 py-3 shadow-[0_8px_30px_rgba(14,18,37,0.08)] backdrop-blur transition-opacity",
            dirty ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <p className="m-0 text-sm text-muted-foreground">
            {dirty
              ? "Unsaved changes to this organization."
              : "All changes saved."}
          </p>
          <div className="flex items-center gap-2">
            <Button
              disabled={!dirty || saving}
              onClick={discard}
              size="sm"
              variant="ghost"
            >
              Discard
            </Button>
            <Button
              className="brand-gradient text-white hover:opacity-95"
              disabled={!dirty || saving || !name.trim()}
              onClick={() => void save()}
              size="sm"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Save profile
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
