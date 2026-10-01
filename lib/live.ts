/** Shape-minimal view of an opportunity for live-status checks (avoids importing full types). */
interface HasEventStatus {
  event: { status: string };
}

/** True when at least one item's event has already started (status === "live"). */
export function hasLiveOpportunities(items: HasEventStatus[]): boolean {
  return items.some((item) => item.event.status === "live");
}

/** Filters to only items whose event has already started. */
export function filterLiveOnly<T extends HasEventStatus>(items: T[]): T[] {
  return items.filter((item) => item.event.status === "live");
}
