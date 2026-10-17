# TraceFence

**NullTrace** · *A source-aware security gateway for AI agents*

Original product: decide what agents may **read** and **do**  not an email-only tool.  
Hackathon demo: campus chat (“NullTrace Institute”) with:

1. **Permission-filtered sources** (role ACLs before context)  
2. **Multi-tool gateway**  search, read, export, optional notify  ALLOW / DENY / REQUIRE_APPROVAL  
3. **Audit / decision rail** (SOURCE → PROPOSAL → DECISION → OUTCOME)

Scope: [`docs/SCOPE_AND_RULES.md`](docs/SCOPE_AND_RULES.md)  
Judge brief: [`docs/JUDGE_AND_TEAM_BRIEF.md`](docs/JUDGE_AND_TEAM_BRIEF.md)  
Design reference (internal only): [`docs/SECURERAG_ALIGNMENT.md`](docs/SECURERAG_ALIGNMENT.md)

## Docs index

| Doc | Purpose |
|---|---|
| [JUDGE_AND_TEAM_BRIEF.md](docs/JUDGE_AND_TEAM_BRIEF.md) | Pitch + sign-off |
| [SYSTEM_OVERVIEW.md](docs/SYSTEM_OVERVIEW.md) | Flow |
| [PRESENTATION.md](docs/PRESENTATION.md) | Slide outline |
| [contracts.md](docs/contracts.md) | APIs / tools |
| [TEAM_AND_GIT.md](docs/TEAM_AND_GIT.md) | Ownership |
| [prompts/](docs/prompts/) | Per-person agent prompts |
| [PROGRESS.md](docs/PROGRESS.md) | Log |

## Code note

`tracefence/` may still contain legacy invoice/task APIs. Rewire to **sessions + filtered retrieval + campus tools** on next `implement`.
