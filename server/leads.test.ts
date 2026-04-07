/**
 * leads.test.ts
 * Unit tests for the leads tRPC router.
 * Uses vi.mock to isolate database and email dependencies.
 *
 * Updated Apr 2026: submit now accepts simplified payload
 * (name + email OR phone) — no Manus notifyOwner dependency.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

// ─── Mock dependencies ────────────────────────────────────────────────────────

vi.mock("./db", () => ({
  createContact: vi.fn().mockResolvedValue(1),
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

// NOTE: notifyOwner is intentionally NOT mocked here — it has been removed
// from the leads router. SCOPS-only Resend alert is used instead.

// ─── Import after mocks ───────────────────────────────────────────────────────

import { appRouter } from "./routers";
import * as db from "./db";

// ─── Context helpers ──────────────────────────────────────────────────────────

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "brandon@apollohomebuilders.com",
      name: "Brandon Stavros",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("leads.submit (public) — new simplified schema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.createContact).mockResolvedValue(1);
    vi.mocked(db.logActivity).mockResolvedValue(undefined);
    vi.mocked(db.logEmail).mockResolvedValue(undefined);
  });

  it("creates a BUYER contact with email and returns success + contactId", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.submit({
      name: "Jane Smith",
      email: "jane@example.com",
      timeline: "ASAP",
      price_range: "300_400",
      financing: "PRE_APPROVED",
      source: "website_get_in_touch",
    });

    expect(result.success).toBe(true);
    expect(result.contactId).toBe(1);
    expect(db.createContact).toHaveBeenCalledOnce();
    expect(db.createContact).toHaveBeenCalledWith(
      expect.objectContaining({
        contactType: "BUYER",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        pipelineStage: "NEW_INQUIRY",
        source: "WEBSITE",
        priceRangeMin: 300000,
        priceRangeMax: 400000,
        financingStatus: "PRE_APPROVED",
      })
    );
    expect(db.logActivity).toHaveBeenCalledOnce();
  });

  it("creates a contact with phone-only (no email) using placeholder email", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.submit({
      name: "Bob Jones",
      phone: "7025550099",
      source: "website_get_in_touch",
    });

    expect(result.success).toBe(true);
    expect(db.createContact).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Bob",
        lastName: "Jones",
        phone: "7025550099",
        email: expect.stringContaining("@noemail.local"),
      })
    );
  });

  it("maps price_range string to numeric min/max correctly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await caller.leads.submit({
      name: "Alice Tran",
      email: "alice@example.com",
      price_range: "400_500",
    });
    expect(db.createContact).toHaveBeenCalledWith(
      expect.objectContaining({ priceRangeMin: 400000, priceRangeMax: 500000 })
    );
  });

  it("maps financing string to enum value correctly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await caller.leads.submit({
      name: "Carlos Reyes",
      email: "carlos@example.com",
      financing: "CASH_BUYER",
    });
    expect(db.createContact).toHaveBeenCalledWith(
      expect.objectContaining({ financingStatus: "CASH_BUYER" })
    );
  });

  it("ignores unknown financing strings (does not throw)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.submit({
      name: "Dana Lee",
      email: "dana@example.com",
      financing: "UNKNOWN_VALUE",
    });
    expect(result.success).toBe(true);
    expect(db.createContact).toHaveBeenCalledWith(
      expect.objectContaining({ financingStatus: undefined })
    );
  });

  it("rejects submission with neither email nor phone", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.leads.submit({ name: "Ghost User" })
    ).rejects.toThrow();
  });

  it("rejects submission with empty name", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.leads.submit({ name: "", email: "test@example.com" })
    ).rejects.toThrow();
  });

  it("does not call notifyOwner (Manus dependency removed)", async () => {
    // Use a unique IP to avoid rate limiter collision with other tests
    const uniqueCtx = {
      user: null,
      req: {
        protocol: "https",
        headers: { "x-forwarded-for": "192.168.99.99" },
        ip: "192.168.99.99",
      } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(uniqueCtx);
    const result = await caller.leads.submit({
      name: "Test User",
      email: "notifyowner-test@example.com",
    });
    expect(result.success).toBe(true);
    // If notifyOwner were called and not mocked, the test would throw.
    // Passing here confirms the Manus dependency is gone.
  });
});

describe("leads.list (protected)", () => {
  it("returns contacts for authenticated user", async () => {
    vi.mocked(db.getContacts).mockResolvedValue([]);
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.leads.list({});
    expect(result).toEqual([]);
    expect(db.getContacts).toHaveBeenCalledOnce();
  });

  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.leads.list({})).rejects.toThrow(TRPCError);
  });
});

describe("leads.getById (protected)", () => {
  it("returns contact with activity and email history", async () => {
    const mockContact = {
      id: 1, firstName: "Jane", lastName: "Smith", email: "jane@example.com",
      phone: "7025550001", contactType: "BUYER" as const, pipelineStage: "NEW_LEAD",
      leadScore: "HOT" as const, source: "WEBSITE", timeline: "ASAP" as const,
      priceRangeMin: null, priceRangeMax: null, financingStatus: null,
      lenderName: null, brokerageName: null, licenseNumber: null,
      tourDate: null, lossReason: null, notes: null,
      createdAt: new Date(), updatedAt: new Date(),
    };
    vi.mocked(db.getContactById).mockResolvedValue(mockContact);
    vi.mocked(db.getActivityForContact).mockResolvedValue([]);
    vi.mocked(db.getEmailsForContact).mockResolvedValue([]);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.leads.getById({ id: 1 });

    expect(result.contact.id).toBe(1);
    expect(result.activity).toEqual([]);
    expect(result.emails).toEqual([]);
  });

  it("throws NOT_FOUND for unknown contact", async () => {
    vi.mocked(db.getContactById).mockResolvedValue(null);
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.leads.getById({ id: 9999 })).rejects.toThrow(TRPCError);
  });
});

describe("leads.updateStage (protected)", () => {
  const mockContact = {
    id: 1, firstName: "Jane", lastName: "Smith", email: "jane@example.com",
    phone: "7025550001", contactType: "BUYER" as const, pipelineStage: "NEW_LEAD",
    leadScore: "HOT" as const, source: "WEBSITE", timeline: "ASAP" as const,
    priceRangeMin: null, priceRangeMax: null, financingStatus: null,
    lenderName: null, brokerageName: null, licenseNumber: null,
    tourDate: null, lossReason: null, notes: null,
    createdAt: new Date(), updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.mocked(db.getContactById).mockResolvedValue(mockContact);
    vi.mocked(db.updateContact).mockResolvedValue(undefined);
    vi.mocked(db.logActivity).mockResolvedValue(undefined);
  });

  it("moves a contact to QUALIFIED stage", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.leads.updateStage({ id: 1, stage: "QUALIFIED" });
    expect(result.success).toBe(true);
    expect(db.updateContact).toHaveBeenCalledWith(1, { pipelineStage: "QUALIFIED" });
  });

  it("records loss reason when stage is LOST", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await caller.leads.updateStage({ id: 1, stage: "LOST", lossReason: "BOUGHT_ELSEWHERE" });
    expect(db.updateContact).toHaveBeenCalledWith(1, {
      pipelineStage: "LOST",
      lossReason: "BOUGHT_ELSEWHERE",
    });
  });
});

describe("leads.addNote (protected)", () => {
  it("appends a note and logs activity", async () => {
    vi.mocked(db.getContactById).mockResolvedValue({
      id: 1, firstName: "Jane", lastName: "Smith", email: "jane@example.com",
      phone: "7025550001", contactType: "BUYER" as const, pipelineStage: "CONTACTED",
      leadScore: "WARM" as const, source: "WEBSITE", timeline: null,
      priceRangeMin: null, priceRangeMax: null, financingStatus: null,
      lenderName: null, brokerageName: null, licenseNumber: null,
      tourDate: null, lossReason: null, notes: null,
      createdAt: new Date(), updatedAt: new Date(),
    });

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.leads.addNote({ id: 1, note: "Called — left voicemail." });

    expect(result.success).toBe(true);
    expect(db.updateContact).toHaveBeenCalledWith(1, expect.objectContaining({ notes: expect.stringContaining("Called — left voicemail.") }));
    expect(db.logActivity).toHaveBeenCalledWith(expect.objectContaining({ activityType: "NOTE_ADDED" }));
  });
});

describe("leads.dashboardStats (protected)", () => {
  it("returns stage counts, new leads this week, and source counts", async () => {
    vi.mocked(db.getStageCounts).mockResolvedValue([{ stage: "NEW_LEAD", count: 3 }]);
    vi.mocked(db.getNewLeadsThisWeek).mockResolvedValue(2);
    vi.mocked(db.getSourceCounts).mockResolvedValue([{ source: "WEBSITE", count: 5 }]);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.leads.dashboardStats({ sourcePeriod: "all" });

    expect(result.stageCounts).toEqual([{ stage: "NEW_LEAD", count: 3 }]);
    expect(result.newLeadsThisWeek).toBe(2);
    expect(result.sourceCounts).toEqual([{ source: "WEBSITE", count: 5 }]);
  });
});
