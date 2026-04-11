/**
 * quo.apikey.test.ts
 * Validates that QUO_API_KEY is set and accepted by the Quo API.
 * Calls GET /v1/phone-numbers — a lightweight read-only endpoint.
 */
import { describe, it, expect } from "vitest";

describe("Quo API key validation", () => {
  it("should connect to Quo API and return phone numbers list", async () => {
    const apiKey = process.env.QUO_API_KEY;
    expect(apiKey, "QUO_API_KEY must be set").toBeTruthy();

    const res = await fetch("https://api.openphone.com/v1/phone-numbers", {
      headers: {
        Authorization: apiKey!,
        "Content-Type": "application/json",
      },
    });

    // 200 = valid key, 401 = invalid key, 403 = valid but no permission
    expect(
      res.status,
      `Quo API returned ${res.status} — check QUO_API_KEY is correct`
    ).not.toBe(401);

    // Accept 200 or 403 (key is valid, just may not have phone-numbers scope)
    expect([200, 403]).toContain(res.status);
  }, 10_000);
});
