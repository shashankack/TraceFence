# Security / policy

## Principles

Default deny · least privilege · data ≠ authority · deterministic enforcement · exact-action approvals · short-lived grants · single gateway path · audit with **source linkage**.

## Source handling

- Only allowlisted synthetic page hosts/paths in DEMO_MODE.
- Inspected HTML is untrusted; never mutates policy.
- Attack email domains (e.g. `external.example`) are DENY, not approval-eligible.

## DEMO_MODE

Fixtures + labels only. Never bypasses DENY.
