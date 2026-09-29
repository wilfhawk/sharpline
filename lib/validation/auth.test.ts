import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "./auth";

describe("loginSchema", () => {
  it("accepts a valid email/password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts matching passwords", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });
});
