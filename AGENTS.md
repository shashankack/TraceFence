<!-- BEGIN ADCE -->
## ADCE

This repository uses ADCE for artifact context management.

Before repository-level modifications:

1. Run `adce status`.
2. Run `adce context --task "<current task>" --format markdown`.
3. Read sections in order: MUST READ → CAUTION → TRUST ORDER → ALSO RELEVANT.
4. Do not trust CAUTION artifacts over TRUST ORDER / VERIFIED sources.
5. Run `adce conflicts` (and `adce analyze` if available) when CAUTION is non-empty.
6. Set known trust with `adce authority set <id> -l CANONICAL|AUTHORITATIVE|SUPPORTING`.
7. Run `adce structure` (default profile: software-eng). Replace stub content in `requirements/`, `design/`, `architecture/`, `decisions/`, `security/`, `schemas/`, `docs/testing/`, and API specs with real project knowledge when those files are still stubs or SUGGESTED.
8. Developers: fill those artifacts yourself, or prompt the coding agent to draft them from the current task/codebase, then review and verify (`adce artifact verify`).
<!-- END ADCE -->
