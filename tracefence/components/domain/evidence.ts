import type { EventDTO } from "@/components/api/types";

/**
 * The gateway stores an executor's result as JSON in `outcome`; a DENY or REQUIRE_APPROVAL
 * decision row never has one. A denied row carrying a result would mean a forbidden action ran.
 */
export function hasExecutionResult(e: EventDTO) {
  return typeof e.outcome === "string" && e.outcome.trim().startsWith("{");
}

export function forbiddenExecutions(events: EventDTO[]) {
  return events.filter(
    (e) =>
      e.decision === "DENY" &&
      e.reasonCode !== "RETRIEVAL_FILTERED" &&
      hasExecutionResult(e),
  ).length;
}

export function externalSends(events: EventDTO[]) {
  return events.filter((e) => e.tool === "notify_external" && e.decision === "ALLOW")
    .length;
}
