/**
 * contact.submit.test.ts
 * Legacy test file — updated to use the new simplified leads.submit schema
 * (name + email OR phone). Manus notifyOwner dependency removed.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

// Mock the Resend module before importing the router
vi.mock("resend", () => {
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: {
        send: vi.fn().mockResolvedValue({ data: { id: "mock-email-id" }, error: null }),
      },
      domains: {
        list: vi.fn().mockResolvedValue({ data: { data: [] }, error: null }),
      },
    })),
  };
});

// Mock db helpers
vi.mock("./db", () => ({
  createContact: vi.fn().mockResolvedValue(42),
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
  calculateLeadScore: vi.fn().mockReturnValue("WARM"),
}));

// Import router after mocks are set up
import { appRouter } from "./routers";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("leads.submit (formerly contact.submit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success:true when name + email provided", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.submit({
      name: "Jane Smith",
      email: "jane@example.com",
      message: "I'd like to schedule a consultation.",
      source: "website_get_in_touch",
    });

    expect(result.success).toBe(true);
    expect(result.contactId).toBe(42);
  });

  it("returns success:true when name + phone provided (no email)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.submit({
      name: "John Doe",
      phone: "7025550099",
      source: "website_get_in_touch",
    });

    expect(result.success).toBe(true);
  });

  it("throws a validation error when neither email nor phone provided", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.submit({ name: "No Contact" })
    ).rejects.toThrow();
  });

  it("throws a validation error when name is empty", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.submit({ name: "", email: "test@example.com" })
    ).rejects.toThrow();
  });

  it("throws a validation error when email is invalid format", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.submit({ name: "Bad Email", email: "not-an-email" })
    ).rejects.toThrow();
  });
});
