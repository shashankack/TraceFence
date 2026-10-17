"use client";

import { Building2, Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/components/api/client";
import type { OrgProfileDTO, OrgType } from "@/components/api/types";
import { RoleGate } from "@/components/auth/RoleGate";
import { BentoTile } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlurFade } from "@/components/ui/motion/blur-fade";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationPage() {
  return (
    <RoleGate allow={["admin"]}>
      <Organization />
    </RoleGate>
  );
}

function Organization() {
  const [profile, setProfile] = useState<OrgProfileDTO | null>(null);
  const [name, setName] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [orgType, setOrgType] = useState<OrgType>("college");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [sizeBand, setSizeBand] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .orgProfile()
      .then((p) => {
        if (!alive) return;
        setProfile(p);
        setName(p.name);
        setNotifyEmail(p.notifyEmail ?? "");
        setOrgType(p.orgType);
        setWebsite(p.profile.website ?? "");
        setCity(p.profile.city ?? "");
        setSizeBand(p.profile.sizeBand ?? "");
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

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const next = await api.updateOrgProfile({
        name,
        notifyEmail: notifyEmail.trim() || null,
        orgType,
        profile: {
          website: website.trim() || undefined,
          city: city.trim() || undefined,
          sizeBand: sizeBand.trim() || undefined,
        },
      });
      setProfile(next);
      toast.success("Organization profile saved");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not save profile";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[720px] p-4 sm:p-6">
      <BlurFade>
        <BentoTile
          icon={Building2}
          kicker={profile ? `tenant · ${profile.id}` : "organization"}
          title="Organization profile"
        >
          {loading ? (
            <Skeleton className="m-5 h-48" />
          ) : (
            <div className="grid gap-4 px-5 py-4">
              <p className="m-0 text-sm text-muted-foreground">
                Admins are emailed when the gateway pauses an action for
                approval. Set the alert address below; every admin membership
                also receives a copy in the Notifications inbox.
              </p>
              {error && <p className="m-0 text-sm text-deny">{error}</p>}
              <div className="grid gap-2">
                <Label htmlFor="org-name">Organization name</Label>
                <Input
                  id="org-name"
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                />
              </div>
              <div className="grid gap-2">
                <Label>Organization type</Label>
                <Select
                  onValueChange={(v) => setOrgType(v as OrgType)}
                  value={orgType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="college">College / university</SelectItem>
                    <SelectItem value="small_business">Small business</SelectItem>
                  </SelectContent>
                </Select>
                <p className="m-0 text-xs text-muted-foreground">
                  Relabels roles in the UI (Student/Faculty vs Member/Manager).
                  Gateway roles stay the same.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notify">Approval notify email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    id="notify"
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    placeholder="admin@your-org.example"
                    type="email"
                    value={notifyEmail}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="grid gap-2 sm:col-span-1">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    onChange={(e) => setCity(e.target.value)}
                    value={city}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-1">
                  <Label htmlFor="size">Size band</Label>
                  <Input
                    id="size"
                    onChange={(e) => setSizeBand(e.target.value)}
                    placeholder="50–200"
                    value={sizeBand}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-1">
                  <Label htmlFor="web">Website</Label>
                  <Input
                    id="web"
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://"
                    value={website}
                  />
                </div>
              </div>
              <Button
                className="brand-gradient w-fit text-white hover:opacity-95"
                disabled={saving || !name.trim()}
                onClick={save}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                Save profile
              </Button>
            </div>
          )}
        </BentoTile>
      </BlurFade>
    </main>
  );
}
