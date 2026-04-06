import { describe, it, expect } from "vitest";
import "dotenv/config";

describe("Calendly API key validation", () => {
  it("should connect to Calendly API and return current user", async () => {
    const apiKey = process.env.CALENDLY_API_KEY;
    expect(apiKey, "CALENDLY_API_KEY must be set").toBeTruthy();

    const res = await fetch("https://api.calendly.com/users/me", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    expect(res.status, `Expected 200 but got ${res.status}`).toBe(200);
    const data = await res.json() as { resource?: { uri?: string; name?: string } };
    expect(data.resource?.uri).toBeTruthy();
    console.log(`[Calendly] Connected as: ${data.resource?.name} (${data.resource?.uri})`);
  }, 15000);
});
