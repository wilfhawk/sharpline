import { describe, expect, it } from "vitest";
import { groupOpportunitiesByEvent } from "./opportunity-groups";
import type { EvOpportunity } from "./types";

function makeOpportunity(
  id: string,
  eventId: string,
  sportsbookName: string,
  evPercent: number
): EvOpportunity {
  const event = {
    id: eventId,
    sport: "Football",
    league: "NFL",
    homeTeam: "Home",
    awayTeam: "Away",
    startTime: "2026-10-01T20:00:00.000Z",
    status: "upcoming" as const,
  };
  const sportsbook = {
    id: `book-${sportsbookName}`,
    name: sportsbookName,
    slug: sportsbookName.toLowerCase(),
    logoUrl: null,
    isSharpReference: false,
  };

  return {
    id,
    event,
    market: {
      id: `market-${id}`,
      event,
      marketType: "moneyline",
      lineValue: null,
      sideALabel: "Home ML",
      sideBLabel: "Away ML",
    },
    sportsbook,
    side: "A",
    sideLabel: "Home ML",
    oddsDecimal: 2,
    fairOddsDecimal: 1.9,
    fairProbability: 0.526,
    evPercent,
    snapshotTimestamp: "2026-10-01T12:00:00.000Z",
  };
}

describe("groupOpportunitiesByEvent", () => {
  it("groups the same game across books and keeps every offer", () => {
    const firstBook = makeOpportunity("offer-1", "game-1", "Book One", 4);
    const secondBook = makeOpportunity("offer-2", "game-1", "Book Two", 7);
    const otherGame = makeOpportunity("offer-3", "game-2", "Book One", 5);

    const groups = groupOpportunitiesByEvent([
      firstBook,
      secondBook,
      otherGame,
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].eventId).toBe("game-1");
    expect(groups[0].opportunities).toEqual([secondBook, firstBook]);
    expect(groups[0].bestOpportunity).toBe(secondBook);
    expect(groups[1].opportunities).toEqual([otherGame]);
  });

  it("returns no groups for an empty feed", () => {
    expect(groupOpportunitiesByEvent([])).toEqual([]);
  });
});