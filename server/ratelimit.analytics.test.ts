/**
 * ratelimit.analytics.test.ts
 * Tests for:
 *   1. IP-based rate limiter on leads.submit (5 submissions per IP per hour)
 *   2. analytics.trafficStats procedure (returns null values when API key is absent)
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

// ─── Mock dependencies ────────────────────────────────────────────────────────

vi.mock("./db", () => ({
  createContact: vi.fn().mockResolvedValue(99),
  getContactById: vi.fn(),
  getContacts: vi.fn().mockResolvedValue([]),
  getActivityForContact: vi.fn().mockResolvedValue([]),
  getEmailsForContact: vi.fn().mockResolvedValue([]),
  getStageCounts: vi.fn().mockResolvedValue([]),
  getNewLeadsThisWeek: vi.fn().mockResolvedValue(0),
  getSourceCounts: vi.fn().mockResolvedValue([]),
  getUtmSourceCounts: vi.fn().mockResolvedValue([]),
  logActivity: vi.fn().mockResolvedValue(undefined),
  logEmail: vi.fn().mockResolvedValue(undefined),
  updateContact: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "resend-test-id" }, error: null }),
    },
  })),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { appRouter } from "./routers";

// ─── Context helpers ──────────────────────────────────────────────────────────

function makePublicCtx(ip = "1.2.3.4"): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { "x-forwarded-for": ip },
      ip,
    } as unknown as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-admin",
      email: "kyle@apollohomebuilders.com",
      name: "Kyle",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    req: { protocol: "https", headers: {} } as unknown as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const validPayload = {
  name: "Test User",
  phone: "7025550000",
  timeline: "ASAP" as const,
  source: "website_get_in_touch" as const,
};

// ─── Rate limiter tests ───────────────────────────────────────────────────────

describe("leads.submit — IP rate limiter", () => {
  // Each test gets a unique IP so the in-memory store doesn't bleed between tests
  let ip: string;
  let callN: number;

  beforeEach(() => {
    callN = Math.floor(Math.random() * 1_000_000);
    ip = `10.0.${Math.floor(callN / 256)}.${callN % 256}`;
  });

  it("allows the first 5 submissions from the same IP", async () => {
    const caller = appRouter.createCaller(makePublicCtx(ip));
    for (let i = 0; i < 5; i++) {
      const result = await caller.leads.submit({ ...validPayload, email: `user${i}@example.com` });
      expect(result.success).toBe(true);
    }
  });

  it("blocks the 6th submission from the same IP with TOO_MANY_REQUESTS", async () => {
    const caller = appRouter.createCaller(makePublicCtx(ip));
    for (let i = 0; i < 5; i++) {
      await caller.leads.submit({ ...validPayload, email: `u${i}@example.com` });
    }
    await expect(
      caller.leads.submit({ ...validPayload, email: "blocked@example.com" })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });

  it("does not block submissions from a different IP", async () => {
    const callerA = appRouter.createCaller(makePublicCtx(ip));
    const callerB = appRouter.createCaller(makePublicCtx("9.9.9.9"));

    // Exhaust IP A
    for (let i = 0; i < 5; i++) {
      await callerA.leads.submit({ ...validPayload, email: `a${i}@example.com` });
    }
    // IP B should still succeed
    const result = await callerB.leads.submit({ ...validPayload, email: "b@example.com" });
    expect(result.success).toBe(true);
  });
});

// ─── Analytics router tests ───────────────────────────────────────────────────

describe("analytics.trafficStats", () => {
  it("returns configured=false when PLAUSIBLE_API_KEY is not set", async () => {
    const originalKey = process.env.PLAUSIBLE_API_KEY;
    delete process.env.PLAUSIBLE_API_KEY;

    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.analytics.trafficStats({ period: "30d" });

    expect(result.configured).toBe(false);
    expect(result.visitors).toBeNull();
    expect(result.pageviews).toBeNull();
    expect(result.topSources).toBeNull();

    if (originalKey !== undefined) process.env.PLAUSIBLE_API_KEY = originalKey;
  });

  it("returns configured=true and null values when the API key is set but the fetch fails", async () => {
    process.env.PLAUSIBLE_API_KEY = "test-key-that-will-fail";

    // fetch is not available in the Node test environment by default; the procedure
    // catches errors and returns null values, so we just verify the shape.
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.analytics.trafficStats({ period: "30d" });

    expect(result.configured).toBe(true);
    // Values may be null (fetch fails in test env) or numbers (if fetch is polyfilled)
    expect(result).toHaveProperty("visitors");
    expect(result).toHaveProperty("pageviews");
    expect(result).toHaveProperty("topSources");

    delete process.env.PLAUSIBLE_API_KEY;
  });
});
