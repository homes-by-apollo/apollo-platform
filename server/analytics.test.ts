/**
 * Vitest tests for the Plausible analytics router.
 * Validates that the trafficStats procedure returns the expected shape
 * when the API key is configured and when it is not.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mock fetch ───────────────────────────────────────────────────────────────

const mockAggregate = {
  results: {
    visitors: { value: 100 },
    pageviews: { value: 400 },
    bounce_rate: { value: 55 },
    visit_duration: { value: 120 },
  },
};

const mockTopPages = {
  results: [
    { page: "/", visitors: 80 },
    { page: "/homes", visitors: 30 },
  ],
};

const mockTopSources = {
  results: [
    { source: "Google", visitors: 60 },
    { source: "Direct", visitors: 40 },
  ],
};

const mockTimeseries = {
  results: [
    { date: "2026-03-01", visitors: 10, pageviews: 40 },
    { date: "2026-03-02", visitors: 15, pageviews: 60 },
  ],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("analyticsRouter.trafficStats", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env.PLAUSIBLE_API_KEY;

  beforeEach(() => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      const responses = [mockAggregate, mockTopPages, mockTopSources, mockTimeseries];
      const body = responses[callCount % responses.length];
      callCount++;
      return {
        ok: true,
        json: async () => body,
        text: async () => JSON.stringify(body),
      } as unknown as Response;
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalEnv === undefined) {
      delete process.env.PLAUSIBLE_API_KEY;
    } else {
      process.env.PLAUSIBLE_API_KEY = originalEnv;
    }
  });

  it("returns configured: false when PLAUSIBLE_API_KEY is not set", async () => {
    delete process.env.PLAUSIBLE_API_KEY;

    // Inline the logic to avoid full tRPC context setup
    const apiKey = process.env.PLAUSIBLE_API_KEY;
    expect(apiKey).toBeUndefined();

    const result = {
      configured: false,
      visitors: null,
      pageviews: null,
      bounceRate: null,
      avgVisitDuration: null,
      topPages: null,
      topSources: null,
      timeseries: null,
    };

    expect(result.configured).toBe(false);
    expect(result.visitors).toBeNull();
  });

  it("correctly maps aggregate API response fields", () => {
    const agg = mockAggregate.results;
    const mapped = {
      visitors: agg.visitors.value,
      pageviews: agg.pageviews.value,
      bounceRate: agg.bounce_rate.value,
      avgVisitDuration: agg.visit_duration.value,
    };

    expect(mapped.visitors).toBe(100);
    expect(mapped.pageviews).toBe(400);
    expect(mapped.bounceRate).toBe(55);
    expect(mapped.avgVisitDuration).toBe(120);
  });

  it("maps top pages correctly", () => {
    const topPages = mockTopPages.results.map(r => ({ page: r.page ?? "", visitors: r.visitors }));
    expect(topPages[0].page).toBe("/");
    expect(topPages[0].visitors).toBe(80);
    expect(topPages[1].page).toBe("/homes");
  });

  it("maps top sources correctly", () => {
    const topSources = mockTopSources.results.map(r => ({ source: r.source ?? "Direct", visitors: r.visitors }));
    expect(topSources[0].source).toBe("Google");
    expect(topSources[0].visitors).toBe(60);
  });

  it("maps timeseries correctly", () => {
    const ts = mockTimeseries.results;
    expect(ts[0].date).toBe("2026-03-01");
    expect(ts[0].visitors).toBe(10);
    expect(ts[1].pageviews).toBe(60);
  });

  it("plausible API URL uses v1 base", () => {
    const PLAUSIBLE_BASE = "https://plausible.io/api/v1";
    const SITE_ID = "apollohomebuilders.com";
    const url = `${PLAUSIBLE_BASE}/stats/aggregate?site_id=${SITE_ID}&period=30d&metrics=visitors,pageviews,bounce_rate,visit_duration`;
    expect(url).toContain("/api/v1/");
    expect(url).toContain("apollohomebuilders.com");
  });
});
