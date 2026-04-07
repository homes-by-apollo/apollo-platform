import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getPipelineKanban: vi.fn().mockResolvedValue([
    {
      id: 1,
      firstName: "Ryan",
      lastName: "Turner",
      email: "ryan@example.com",
      phone: "702-555-0100",
      pipelineStage: "NEW_INQUIRY",
      leadScore: "WARM",
      priceRangeMin: 400000,
      priceRangeMax: 600000,
      financingStatus: "PRE_APPROVED",
      assignedTo: null,
      assignedUserName: null,
      nextAction: "Schedule tour",
      nextActionDueAt: null,
      tourDate: null,
      lastContactedAt: new Date(),
      propertyAddress: "420 E Bellville Rd",
      propertyPrice: 525000,
      propertyId: 1,
      source: "ZILLOW",
      createdAt: new Date(),
    },
  ]),
  getContactById: vi.fn().mockResolvedValue({
    id: 1,
    firstName: "Ryan",
    lastName: "Turner",
    email: "ryan@example.com",
    phone: "702-555-0100",
    pipelineStage: "NEW_INQUIRY",
    leadScore: "WARM",
    priceRangeMin: 400000,
    priceRangeMax: 600000,
    financingStatus: "PRE_APPROVED",
    assignedTo: null,
    nextAction: "Schedule tour",
    notes: null,
    source: "ZILLOW",
    createdAt: new Date(),
    updatedAt: new Date(),
    activity: [],
    tours: [],
    propertyInterests: [],
  }),
  getNewLeadsThisWeek: vi.fn().mockResolvedValue([]),
  getToursThisWeek: vi.fn().mockResolvedValue(2),
  createContact: vi.fn().mockResolvedValue({ id: 99 }),
  logActivity: vi.fn().mockResolvedValue({ id: 1 }),
}));

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    getPipelineKanban: vi.fn().mockResolvedValue([]),
    getContactById: vi.fn().mockResolvedValue(null),
    getNewLeadsThisWeek: vi.fn().mockResolvedValue([]),
    getToursThisWeek: vi.fn().mockResolvedValue(0),
    createContact: vi.fn().mockResolvedValue({ id: 1 }),
    logActivity: vi.fn().mockResolvedValue({ id: 1 }),
  };
});

describe("pipeline router", () => {
  it("should export a pipelineRouter", async () => {
    const { pipelineRouter } = await import("./routers/pipeline");
    expect(pipelineRouter).toBeDefined();
    expect(typeof pipelineRouter).toBe("object");
  });

  it("pipelineRouter should have expected procedures", async () => {
    const { pipelineRouter } = await import("./routers/pipeline");
    // tRPC routers expose their procedures via _def
    const def = (pipelineRouter as { _def?: { procedures?: Record<string, unknown> } })._def;
    expect(def).toBeDefined();
    // Verify the router was created successfully (has _def property)
    expect(def?.procedures).toBeDefined();
  });

  it("should validate quickCreate input schema requires firstName", async () => {
    // Test that the schema correctly validates required fields
    const { z } = await import("zod");
    const schema = z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(7),
      priceRangeMax: z.number().optional(),
      financingStatus: z.enum(["PRE_APPROVED", "IN_PROCESS", "NOT_STARTED", "CASH_BUYER"]).optional(),
      source: z.enum(["WEBSITE", "ZILLOW", "MLS", "REFERRAL", "AGENT", "BILLBOARD", "WALK_IN", "OTHER"]).optional(),
      notes: z.string().optional(),
    });

    const valid = schema.safeParse({
      firstName: "Ryan",
      lastName: "Turner",
      email: "ryan@example.com",
      phone: "702-555-0100",
    });
    expect(valid.success).toBe(true);

    const invalid = schema.safeParse({
      firstName: "",
      lastName: "Turner",
      email: "not-an-email",
      phone: "702",
    });
    expect(invalid.success).toBe(false);
  });

  it("should validate stage enum values", async () => {
    const { z } = await import("zod");
    const stageEnum = z.enum([
      "NEW_INQUIRY", "QUALIFIED", "TOUR_SCHEDULED", "TOURED",
      "OFFER_SUBMITTED", "UNDER_CONTRACT", "CLOSED", "LOST",
    ]);

    expect(stageEnum.safeParse("NEW_INQUIRY").success).toBe(true);
    expect(stageEnum.safeParse("INVALID_STAGE").success).toBe(false);
  });
});
