/**
 * Campus chat orchestration lives in lib/campus/chat.ts.
 * Legacy task/invoice run loop is deprecated.
 */
export function orchestratorDeprecated(): never {
  throw new Error(
    "Legacy orchestrator removed — use POST /api/sessions/:id/messages",
  );
}
