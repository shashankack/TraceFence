export type OrgType = "college" | "small_business";

export type OrgProfile = {
  website?: string;
  city?: string;
  sizeBand?: string;
};

export function isOrgType(v: unknown): v is OrgType {
  return v === "college" || v === "small_business";
}
