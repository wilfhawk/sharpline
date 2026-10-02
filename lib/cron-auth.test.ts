import { describe, expect, it } from "vitest";
import { isCronAuthorized } from "./cron-auth";

describe("isCronAuthorized", () => {
  it("rejects production cron requests when the secret is missing", () => {
    expect(isCronAuthorized(undefined, "production", null)).toBe(false);
  });

  it("allows local cron requests when no secret is configured", () => {
    expect(isCronAuthorized(undefined, "development", null)).toBe(true);
  });

  it("requires an exact bearer token when a secret is configured", () => {
    expect(isCronAuthorized("expected", "production", "Bearer wrong")).toBe(false);
    expect(isCronAuthorized("expected", "production", "Bearer expected")).toBe(true);
  });
});