/**
 * contact.submit.test.ts
 * Legacy test file — updated to use the new leads.submit procedure
 * which replaced the old contact.submit endpoint.
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

// Mock the notification helper so it doesn't make real HTTP calls
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock db helpers
vi.mock("./db", () => ({
  createContact: vi.fn().mockResolvedValue(42),
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

  it("returns success:true when all required fields are provided", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.submit({
      contactType: "BUYER",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      phone: "(702) 555-1234",
      message: "I'd like to schedule a consultation.",
    });

    expect(result.success).toBe(true);
    expect(result.contactId).toBe(42);
  });

  it("returns success:true for an agent contact", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.submit({
      contactType: "AGENT",
      firstName: "John",
      lastName: "Doe",
      email: "john@realty.com",
      phone: "(702) 555-5678",
    });

    expect(result.success).toBe(true);
  });

  it("throws a validation error when email is invalid", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.submit({
        contactType: "BUYER",
        firstName: "No",
        lastName: "Email",
        email: "not-an-email",
        phone: "7025550000",
      })
    ).rejects.toThrow();
  });

  it("throws a validation error when firstName is empty", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.submit({
        contactType: "BUYER",
        firstName: "",
        lastName: "Smith",
        email: "test@example.com",
        phone: "7025550000",
      })
    ).rejects.toThrow();
  });

  it("throws a validation error when phone is too short", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.submit({
        contactType: "BUYER",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        phone: "123",
      })
    ).rejects.toThrow();
  });
});
