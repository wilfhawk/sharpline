import { describe, expect, it } from "vitest";
import { safeAuthRedirect } from "./auth-redirect";

describe("safeAuthRedirect", () => {
  it.each(["https://example.com", "//example.com", "/\\example.com", "javascript:alert(1)", "/%2f%2fexample.com", null])("rejects unsafe target %s", (target) => {
    expect(safeAuthRedirect(target)).toBe("/dashboard");
  });
  it("preserves the password recovery destination", () => {
    expect(safeAuthRedirect("/reset-password")).toBe("/reset-password");
  });
});