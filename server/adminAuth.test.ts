import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { verifyAdminToken } from "./routers/adminAuth";

describe("adminAuth", () => {
  it("bcrypt hash and compare works correctly", async () => {
    const password = "TestPassword123!";
    const hash = await bcrypt.hash(password, 10);
    const valid = await bcrypt.compare(password, hash);
    const invalid = await bcrypt.compare("wrongpassword", hash);
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
  });

  it("verifyAdminToken returns null for invalid token", async () => {
    const result = await verifyAdminToken("not-a-valid-token");
    expect(result).toBeNull();
  });

  it("verifyAdminToken returns null for empty string", async () => {
    const result = await verifyAdminToken("");
    expect(result).toBeNull();
  });
});
