# Design overview

UI surfaces (see [`docs/SYSTEM_OVERVIEW.md`](../docs/SYSTEM_OVERVIEW.md)):

1. Mission Control — task + permissions
2. Live Trace — decision timeline
3. Approval Drawer — exact payload review
4. Audit Report — security evidence

## UX principles

- Make ALLOW / DENY / REQUIRE_APPROVAL obvious.
- Show reason codes, not only colors.
- Approval UI shows exact args; no vague “allow email tool.”
- Prefer clarity over decorative dashboards for the hackathon.

## Owner

`venilashree` implements UI under `trustfence/components/**` and app pages. Visual permission graph (React Flow) is P1 only.
