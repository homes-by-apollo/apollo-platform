/**
 * leads.test.ts
 * Unit tests for the leads tRPC router.
 * Uses vi.mock to isolate database and email dependencies.
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

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

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

describe("leads.submit (public)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.createContact).mockResolvedValue(1);
    vi.mocked(db.logActivity).mockResolvedValue(undefined);
    vi.mocked(db.logEmail).mockResolvedValue(undefined);
  });

  it("creates a BUYER contact and returns success + contactId", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.submit({
      contactType: "BUYER",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      phone: "7025550001",
      timeline: "ASAP",
      financingStatus: "PRE_APPROVED",
    });

    expect(result.success).toBe(true);
    expect(result.contactId).toBe(1);
    expect(db.createContact).toHaveBeenCalledOnce();
    expect(db.logActivity).toHaveBeenCalledOnce();
  });

  it("creates an AGENT contact successfully", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.submit({
      contactType: "AGENT",
      firstName: "Mike",
      lastName: "Jones",
      email: "mike@realty.com",
      phone: "7025550002",
      brokerageName: "Nevada Realty Group",
    });

    expect(result.success).toBe(true);
    expect(db.createContact).toHaveBeenCalledWith(
      expect.objectContaining({ contactType: "AGENT", brokerageName: "Nevada Realty Group" })
    );
  });

  it("rejects submission with missing required fields", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.leads.submit({
        contactType: "BUYER",
        firstName: "",
        lastName: "Smith",
        email: "bad-email",
        phone: "123",
      })
    ).rejects.toThrow();
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

  it("moves a contact to CONTACTED stage", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.leads.updateStage({ id: 1, stage: "CONTACTED" });
    expect(result.success).toBe(true);
    expect(db.updateContact).toHaveBeenCalledWith(1, { pipelineStage: "CONTACTED" });
  });

  it("rejects SQL promotion when timeline is JUST_BROWSING", async () => {
    vi.mocked(db.getContactById).mockResolvedValue({
      ...mockContact, timeline: "JUST_BROWSING",
    });
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.leads.updateStage({ id: 1, stage: "SQL" })
    ).rejects.toThrow(TRPCError);
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
  it("returns stage counts and new leads this week", async () => {
    vi.mocked(db.getStageCounts).mockResolvedValue([{ stage: "NEW_LEAD", count: 3 }]);
    vi.mocked(db.getNewLeadsThisWeek).mockResolvedValue(2);

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.leads.dashboardStats();

    expect(result.stageCounts).toEqual([{ stage: "NEW_LEAD", count: 3 }]);
    expect(result.newLeadsThisWeek).toBe(2);
  });
});
