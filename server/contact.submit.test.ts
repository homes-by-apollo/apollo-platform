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

// Import router after mocks are set up
const { appRouter } = await import("./routers");

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

describe("contact.submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success:true when all required fields are provided", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contact.submit({
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "(702) 555-1234",
      message: "Interest: buy\n\nI'd like to schedule a consultation.",
    });

    expect(result).toEqual({ success: true });
  });

  it("returns success:true without optional phone field", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contact.submit({
      name: "John Doe",
      email: "john@example.com",
      message: "Interest: build\n\nI want a custom home.",
    });

    expect(result).toEqual({ success: true });
  });

  it("throws a validation error when email is missing", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.contact.submit({
        name: "No Email",
        email: "not-an-email",
        message: "Test message",
      })
    ).rejects.toThrow();
  });

  it("throws a validation error when name is empty", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.contact.submit({
        name: "",
        email: "test@example.com",
        message: "Test message",
      })
    ).rejects.toThrow();
  });

  it("throws a validation error when message is empty", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.contact.submit({
        name: "Test User",
        email: "test@example.com",
        message: "",
      })
    ).rejects.toThrow();
  });
});
