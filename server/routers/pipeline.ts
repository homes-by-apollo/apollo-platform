import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createContact,
  getActivityForContact,
  getContactById,
  getPipelineKanban,
  getStageCounts,
  getToursThisWeek,
  getNewLeadsThisWeek,
  logActivity,
  updateContact,
  getDb,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { contacts, leadPropertyInterest, properties, scheduledTours } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// ─── Shared enums ─────────────────────────────────────────────────────────────
const pipelineStageEnum = z.enum([
  "NEW_INQUIRY", "QUALIFIED",
  "TOUR_SCHEDULED", "TOURED",
  "OFFER_SUBMITTED", "UNDER_CONTRACT", "CLOSED", "LOST",
]);

export const pipelineRouter = router({
  /**
   * Returns all active leads grouped by pipeline stage.
   * Powers the Pipeline board view.
   */
  board: protectedProcedure.query(async () => {
    const rows = await getPipelineKanban();
    // Group by stage
    const stages: Record<string, typeof rows> = {
      NEW_INQUIRY: [],
      QUALIFIED: [],
      TOUR_SCHEDULED: [],
      TOURED: [],
      OFFER_SUBMITTED: [],
      UNDER_CONTRACT: [],
      CLOSED: [],
      LOST: [],
    };
    for (const row of rows) {
      const stage = row.pipelineStage ?? "NEW_INQUIRY";
      if (stages[stage]) stages[stage].push(row);
    }
    return stages;
  }),

  /**
   * Returns all active leads as a flat list (for the lead list panel).
   */
  list: protectedProcedure
    .input(z.object({
      stage: pipelineStageEnum.optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const rows = await getPipelineKanban();
      let filtered = rows;
      if (input?.stage) {
        filtered = filtered.filter(r => r.pipelineStage === input.stage);
      }
      if (input?.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(r =>
          `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
          (r.propertyAddress ?? "").toLowerCase().includes(q) ||
          (r.email ?? "").toLowerCase().includes(q)
        );
      }
      return filtered;
    }),

  /**
   * Returns full lead detail: contact + activity log + tours + property interests.
   */
  detail: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const contact = await getContactById(input.id);
      if (!contact) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Activity log
      const activity = await getActivityForContact(input.id);

      // Upcoming tours
      const tours = await db
        .select({
          id: scheduledTours.id,
          eventName: scheduledTours.eventName,
          startTime: scheduledTours.startTime,
          endTime: scheduledTours.endTime,
          status: scheduledTours.status,
          location: scheduledTours.location,
        })
        .from(scheduledTours)
        .where(eq(scheduledTours.contactId, input.id))
        .orderBy(desc(scheduledTours.startTime))
        .limit(5);

      // Property interests
      const interests = await db
        .select({
          id: leadPropertyInterest.id,
          propertyId: leadPropertyInterest.propertyId,
          interestLevel: leadPropertyInterest.interestLevel,
          isPrimaryInterest: leadPropertyInterest.isPrimaryInterest,
          viewCount: leadPropertyInterest.viewCount,
          address: properties.address,
          price: properties.price,
          imageUrl: properties.imageUrl,
          tag: properties.tag,
          beds: properties.beds,
          baths: properties.baths,
          sqft: properties.sqft,
        })
        .from(leadPropertyInterest)
        .leftJoin(properties, eq(leadPropertyInterest.propertyId, properties.id))
        .where(eq(leadPropertyInterest.leadId, input.id))
        .orderBy(desc(leadPropertyInterest.isPrimaryInterest));

      return {
        contact,
        activity: activity.slice(0, 20),
        tours,
        interests,
      };
    }),

  /**
   * KPI summary: total active leads, at-risk count, tours this week, new this week.
   */
  summary: protectedProcedure.query(async () => {
    const [stageCounts, toursThisWeek, newThisWeek] = await Promise.all([
      getStageCounts(),
      getToursThisWeek(),
      getNewLeadsThisWeek(),
    ]);

    const activeStages = ["NEW_INQUIRY", "QUALIFIED", "TOUR_SCHEDULED", "TOURED", "OFFER_SUBMITTED", "UNDER_CONTRACT"];
    const totalActive = stageCounts
      .filter((s: { stage: string }) => activeStages.includes(s.stage))
      .reduce((sum: number, s: { count: number }) => sum + s.count, 0);

    // At-risk: leads in active stages not contacted in 48h
    const rows = await getPipelineKanban();
    const now = Date.now();
    const atRisk = rows.filter(r => r.isOverdue && activeStages.includes(r.pipelineStage ?? "")).length;

    return {
      totalActive,
      atRisk,
      toursThisWeek: toursThisWeek as number,
      newThisWeek: newThisWeek as number,
      stageCounts,
    };
  }),

  /**
   * Quick-create a new lead from the Pipeline quick-add sheet.
   */
  quickCreate: protectedProcedure
    .input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(7),
      priceRangeMin: z.number().optional(),
      priceRangeMax: z.number().optional(),
      financingStatus: z.enum(["PRE_APPROVED", "IN_PROCESS", "NOT_STARTED", "CASH_BUYER"]).optional(),
      timeline: z.enum(["ASAP", "1_3_MONTHS", "3_6_MONTHS", "6_12_MONTHS", "JUST_BROWSING"]).optional(),
      source: z.enum(["WEBSITE", "ZILLOW", "MLS", "REFERRAL", "AGENT", "BILLBOARD", "WALK_IN", "OTHER"]).optional(),
      notes: z.string().optional(),
      initialStage: pipelineStageEnum.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { notes, initialStage, ...contactData } = input;
      const id = await createContact({
        ...contactData,
        contactType: "BUYER",
        pipelineStage: initialStage ?? "NEW_INQUIRY",
      });
      if (notes) {
        await logActivity({
          contactId: id,
          userId: ctx.user.id,
          activityType: "NOTE_ADDED",
          description: notes,
        });
      }
      await logActivity({
        contactId: id,
        userId: ctx.user.id,
        activityType: "NOTE_ADDED",
        description: `Lead created via Pipeline quick-add by ${ctx.user.name ?? "admin"}`,
      });
      return { id };
    }),

  /**
   * Update a lead's pipeline stage.
   */
  updateStage: protectedProcedure
    .input(z.object({
      id: z.number(),
      stage: pipelineStageEnum,
      lossReason: z.enum(["BOUGHT_ELSEWHERE", "FINANCING_FAILED", "TIMELINE_CHANGED", "PRICE_TOO_HIGH", "NO_RESPONSE", "OTHER"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getContactById(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      await updateContact(input.id, {
        pipelineStage: input.stage,
        ...(input.lossReason ? { lossReason: input.lossReason } : {}),
      });
      await logActivity({
        contactId: input.id,
        userId: ctx.user.id,
      activityType: "STAGE_CHANGE",
          description: `Stage changed to ${input.stage}${input.lossReason ? ` (${input.lossReason})` : ""}`,
      });
      return { success: true };
    }),

  /**
   * Add an activity note to a lead.
   */
  addActivity: protectedProcedure
    .input(z.object({
      contactId: z.number(),
      activityType: z.enum(["NOTE_ADDED", "CALL_LOGGED", "EMAIL_SENT", "TOUR_SCHEDULED", "STAGE_CHANGE", "FORM_SUBMITTED", "SCORE_UPDATED"]),
      description: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getContactById(input.contactId);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      await logActivity({
        contactId: input.contactId,
        userId: ctx.user.id,
        activityType: input.activityType,
        description: input.description,
      });
      // Update lastContactedAt
      await updateContact(input.contactId, { lastContactedAt: new Date() });
      return { success: true };
    }),

  /**
   * Update lead contact details (name, phone, budget, financing, assigned rep).
   */
  updateLead: protectedProcedure
    .input(z.object({
      id: z.number(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      phone: z.string().optional(),
      priceRangeMin: z.number().nullable().optional(),
      priceRangeMax: z.number().nullable().optional(),
      financingStatus: z.enum(["PRE_APPROVED", "IN_PROCESS", "NOT_STARTED", "CASH_BUYER"]).nullable().optional(),
      assignedTo: z.number().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await getContactById(id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      await updateContact(id, data);
      await logActivity({
        contactId: id,
        userId: ctx.user.id,
        activityType: "NOTE_ADDED",
        description: `Lead details updated by ${ctx.user.name ?? "admin"}`,
      });
      return { success: true };
    }),

  /**
   * Update next action for a lead.
   */
  updateNextAction: protectedProcedure
    .input(z.object({
      id: z.number(),
      nextAction: z.string().optional(),
      nextActionDueAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateContact(id, data);
      await logActivity({
        contactId: id,
        userId: ctx.user.id,
        activityType: "NOTE_ADDED",
        description: `Next action updated: ${data.nextAction ?? "(cleared)"}`,
      });
      return { success: true };
    }),
});
