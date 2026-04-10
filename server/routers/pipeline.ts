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
  getDealsAtRisk,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { contacts, leadPropertyInterest, properties, scheduledTours, adminCredentials } from "../../drizzle/schema";
import { eq, desc, and, lte, isNotNull, not, inArray } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
        stageEnteredAt: new Date(),
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

  /**
   * Cron-callable: finds leads with overdue nextActionDueAt, logs an OVERDUE
   * activity, and fires a Resend alert to the assigned rep (or all admins if
   * no rep is assigned). Returns a summary of flagged leads.
   *
   * Designed to be called by the server-side cron every 15 minutes.
   */
  flagStale: protectedProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const now = new Date();
    const activeStages = ["NEW_INQUIRY", "QUALIFIED", "TOUR_SCHEDULED", "TOURED", "OFFER_SUBMITTED", "UNDER_CONTRACT"];

    // Find leads with a past nextActionDueAt that haven't been marked yet
    const overdueLeads = await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        nextAction: contacts.nextAction,
        nextActionDueAt: contacts.nextActionDueAt,
        pipelineStage: contacts.pipelineStage,
        assignedTo: contacts.assignedTo,
        repEmail: adminCredentials.email,
        repName: adminCredentials.name,
      })
      .from(contacts)
      .leftJoin(adminCredentials, eq(contacts.assignedTo, adminCredentials.id))
      .where(
        and(
          isNotNull(contacts.nextActionDueAt),
          lte(contacts.nextActionDueAt, now),
          inArray(contacts.pipelineStage, activeStages as ("NEW_INQUIRY" | "QUALIFIED" | "TOUR_SCHEDULED" | "TOURED" | "OFFER_SUBMITTED" | "UNDER_CONTRACT")[])
        )
      );

    if (overdueLeads.length === 0) return { flagged: 0, alerts: 0 };

    // Get fallback admin emails (all admins) for unassigned leads
    const allAdmins = await db
      .select({ email: adminCredentials.email, name: adminCredentials.name })
      .from(adminCredentials);

    let flagged = 0;
    let alerts = 0;

    for (const lead of overdueLeads) {
      // Log overdue activity
      await logActivity({
        contactId: lead.id,
        activityType: "NOTE_ADDED",
        description: `OVERDUE: Action "${lead.nextAction ?? "Follow up"}" was due ${lead.nextActionDueAt?.toLocaleDateString() ?? "(unknown date)"} and has not been completed.`,
      });

      // Clear nextActionDueAt so this lead is not re-flagged on the next run
      await updateContact(lead.id, { nextActionDueAt: null });
      flagged++;

      // Determine who to alert
      const recipients: { email: string; name: string }[] = lead.repEmail
        ? [{ email: lead.repEmail, name: lead.repName ?? "Rep" }]
        : allAdmins;

      const leadName = `${lead.firstName} ${lead.lastName}`.trim();
      const stageLabel: Record<string, string> = {
        NEW_INQUIRY: "New Inquiry", QUALIFIED: "Qualified",
        TOUR_SCHEDULED: "Tour Scheduled", TOURED: "Toured",
        OFFER_SUBMITTED: "Offer Submitted", UNDER_CONTRACT: "Under Contract",
      };

      for (const rep of recipients) {
        const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#fff">
  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px 24px;margin-bottom:24px">
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.06em">Action Overdue</p>
    <p style="margin:0;font-size:22px;font-weight:800;color:#111">${leadName}</p>
    <p style="margin:4px 0 0;font-size:14px;color:#6b7280">${stageLabel[lead.pipelineStage ?? ""] ?? lead.pipelineStage}</p>
  </div>
  <p style="font-size:15px;color:#374151;line-height:1.7">
    Hi ${rep.name}, the following action for <strong>${leadName}</strong> was due on
    <strong>${lead.nextActionDueAt?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) ?? "(date unknown)"}</strong>
    and has not been completed:
  </p>
  <div style="background:#f9fafb;border-left:4px solid #3b82f6;padding:14px 18px;border-radius:0 8px 8px 0;margin:16px 0">
    <p style="margin:0;font-size:15px;font-weight:600;color:#111">${lead.nextAction ?? "Follow up with lead"}</p>
  </div>
  <p style="font-size:14px;color:#6b7280;line-height:1.7">
    Please log into the Apollo SCOPS dashboard to update this lead's status and schedule the next action.
  </p>
  <a href="https://apollohomebuilders.com/scops/pipeline" style="display:inline-block;background:#0f2044;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;margin-top:8px">Open Pipeline</a>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0" />
  <p style="color:#9ca3af;font-size:12px">Apollo Home Builders &middot; Pahrump, NV &middot; (775) 910-7771</p>
</div>`;

        try {
          const { error } = await resend.emails.send({
            from: "Apollo SCOPS <hello@apollohomebuilders.com>",
            to: rep.email,
            subject: `[Action Overdue] ${leadName} — ${lead.nextAction ?? "Follow up"}`,
            html,
          });
          if (!error) alerts++;
        } catch {
          // Non-fatal — continue processing other leads
        }
      }
    }

    return { flagged, alerts };
  }),

  /**
   * Bulk-move multiple leads to a new pipeline stage.
   * Used by the Kanban bulk-select action bar.
   */
  bulkMoveStage: protectedProcedure
    .input(z.object({
      ids: z.array(z.number()).min(1),
      stage: pipelineStageEnum,
      lossReason: z.enum(["BOUGHT_ELSEWHERE", "FINANCING_FAILED", "TIMELINE_CHANGED", "PRICE_TOO_HIGH", "NO_RESPONSE", "OTHER"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      let moved = 0;
      for (const id of input.ids) {
        const existing = await getContactById(id);
        if (!existing) continue;
        await updateContact(id, {
          pipelineStage: input.stage,
          ...(input.lossReason ? { lossReason: input.lossReason } : {}),
        });
        await logActivity({
          contactId: id,
          userId: ctx.user.id,
          activityType: "STAGE_CHANGE",
          description: `Bulk stage move to ${input.stage} by ${ctx.user.name ?? "admin"}${input.lossReason ? ` (${input.lossReason})` : ""}`,
        });
        moved++;
      }
        return { moved };
    }),

  /**
   * Deals at Risk: leads not contacted in 48+ hours.
   * Moved here from Dashboard so Pipeline tab can display them at the top.
   */
  dealsAtRisk: protectedProcedure.query(async () => {
    return getDealsAtRisk();
  }),
});
