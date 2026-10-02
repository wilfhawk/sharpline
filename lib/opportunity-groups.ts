import type { EvOpportunity } from "./types";

export interface EventOpportunityGroup {
  eventId: string;
  opportunities: EvOpportunity[];
  bestOpportunity: EvOpportunity;
}

export function groupOpportunitiesByEvent(
  opportunities: EvOpportunity[]
): EventOpportunityGroup[] {
  const groups = new Map<string, EvOpportunity[]>();

  for (const opportunity of opportunities) {
    const group = groups.get(opportunity.event.id);
    if (group) {
      group.push(opportunity);
    } else {
      groups.set(opportunity.event.id, [opportunity]);
    }
  }

  return [...groups.entries()].map(([eventId, eventOpportunities]) => {
    const sorted = [...eventOpportunities].sort(
      (a, b) => b.evPercent - a.evPercent
    );
    return {
      eventId,
      opportunities: sorted,
      bestOpportunity: sorted[0],
    };
  });
}