import { TRPCError } from "@trpc/server";
import { Resend } from "resend";
import { z } from "zod";
import {
  createContact,
  getActivityForContact,
  getContactById,
  getContacts,
  getEmailsForContact,
  getNewLeadsThisWeek,
  getStageCounts,
  logActivity,
  logEmail,
  updateContact,
} from "../db";
import { notifyOwner } from "../_core/notification";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── IP-based rate limiter ────────────────────────────────────────────────────
// Allows at most MAX_SUBMISSIONS per IP within WINDOW_MS.
// Uses an in-memory Map; resets on server restart (acceptable for this scale).

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS = 5;

const ipSubmissions = new Map<string, number[]>();

function getClientIp(req: { ip?: string; headers: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return first.trim();
  }
  return req.ip ?? "unknown";
}

function checkRateLimit(ip: string): void {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const timestamps = (ipSubmissions.get(ip) ?? []).filter(t => t > windowStart);

  if (timestamps.length >= MAX_SUBMISSIONS) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Too many submissions. Please wait before submitting again.`,
    });
  }

  timestamps.push(now);
  ipSubmissions.set(ip, timestamps);

  // Prune stale IPs every ~500 calls to prevent unbounded memory growth
  if (Math.random() < 0.002) {
    const keys = Array.from(ipSubmissions.keys());
    for (const key of keys) {
      const times = ipSubmissions.get(key)!;
      if (times.every((t: number) => t <= windowStart)) ipSubmissions.delete(key);
    }
  }
}

// ─── Shared Zod schemas ───────────────────────────────────────────────────────

const timelineEnum = z.enum(["ASAP", "1_3_MONTHS", "3_6_MONTHS", "6_12_MONTHS", "JUST_BROWSING"]);
const financingEnum = z.enum(["PRE_APPROVED", "IN_PROCESS", "NOT_STARTED", "CASH_BUYER"]);
const pipelineStageEnum = z.enum([
  "NEW_LEAD", "CONTACTED", "NURTURE", "SQL",
  "TOUR_SCHEDULED", "TOUR_COMPLETED", "PROPOSAL_SENT",
  "CONTRACT_SIGNED", "IN_CONSTRUCTION", "CLOSED", "LOST",
]);
const lossReasonEnum = z.enum([
  "BOUGHT_ELSEWHERE", "FINANCING_FAILED", "TIMELINE_CHANGED",
  "PRICE_TOO_HIGH", "NO_RESPONSE", "OTHER",
]);

// ─── Lead welcome email helper ────────────────────────────────────────────────

async function sendLeadWelcomeEmail(contact: {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  contactType: "BUYER" | "AGENT";
}) {
  const subject =
    contact.contactType === "AGENT"
      ? "Welcome to Apollo Home Builders — Agent Partnership"
      : "Welcome to Apollo Home Builders — We'll be in touch shortly";

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #0f2044; padding: 32px 40px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">HOMES BY APOLLO</h1>
        <p style="color: rgba(255,255,255,0.6); font-size: 13px; margin: 4px 0 0;">Pahrump, Nevada</p>
      </div>
      <div style="padding: 40px; border: 1px solid #e8ecf0; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #0f2044; font-size: 20px; font-weight: 700; margin: 0 0 16px;">Hi ${contact.firstName},</h2>
        <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
          Thank you for reaching out to Apollo Home Builders. We've received your information and Brandon will be in touch with you shortly.
        </p>
        ${contact.contactType === "BUYER" ? `
        <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
          In the meantime, explore our available floor plans and lots in Pahrump, Nevada — no state income tax, wide-open desert views, and just 60 miles from Las Vegas.
        </p>
        <div style="margin: 28px 0;">
          <a href="https://apollohomebuilders.com" style="display: inline-block; background: #0f2044; color: white; padding: 14px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none; margin-right: 12px;">View Floor Plans</a>
          <a href="https://apollohomebuilders.com" style="display: inline-block; background: transparent; color: #0f2044; padding: 14px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none; border: 2px solid #0f2044;">Schedule a Tour</a>
        </div>
        ` : `
        <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
          We look forward to discussing our agent partnership program and how we can work together to serve your clients in Pahrump, Nevada.
        </p>
        `}
        <hr style="border: none; border-top: 1px solid #e8ecf0; margin: 28px 0;">
        <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
          <strong>Brandon Stavros</strong><br>
          Apollo Home Builders<br>
          📞 725-333-5525<br>
          📧 brandon@apollohomebuilders.com
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0;">
          NV License No. 0077907 · 5158 Arville St, Las Vegas, NV 89118
        </p>
      </div>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: "Apollo Home Builders <hello@apollohomebuilders.com>",
    to: [contact.email],
    subject,
    html,
  });

  if (error) {
    console.error("[Resend] lead_welcome failed:", error);
    return null;
  }

  // Log to email_log table
  await logEmail({
    contactId: contact.id,
    templateId: "lead_welcome",
    subject,
    toEmail: contact.email,
    resendId: data?.id ?? null,
    status: "SENT",
  });

  return data?.id ?? null;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const leadsRouter = router({

  /**
   * Public: submit a new lead from the website contact form.
   * Creates a contact record, sends welcome email, notifies owner.
   */
  submit: publicProcedure
    .input(
      z.object({
        contactType: z.enum(["BUYER", "AGENT"]).default("BUYER"),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(7),
        timeline: timelineEnum.optional(),
        priceRangeMin: z.number().optional(),
        priceRangeMax: z.number().optional(),
        financingStatus: financingEnum.optional(),
        // Agent-specific
        brokerageName: z.string().optional(),
        licenseNumber: z.string().optional(),
        // Extra
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Rate-limit: 5 submissions per IP per hour
      const ip = getClientIp(ctx.req as any);
      checkRateLimit(ip);
      const contactId = await createContact({
        contactType: input.contactType,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        timeline: input.timeline,
        priceRangeMin: input.priceRangeMin,
        priceRangeMax: input.priceRangeMax,
        financingStatus: input.financingStatus,
        brokerageName: input.brokerageName,
        licenseNumber: input.licenseNumber,
        source: "WEBSITE",
        pipelineStage: "NEW_LEAD",
      });

      // Log the form submission activity
      await logActivity({
        contactId,
        activityType: "FORM_SUBMITTED",
        description: `New ${input.contactType === "AGENT" ? "agent" : "buyer"} lead submitted via website form.${input.message ? ` Message: "${input.message}"` : ""}`,
      });

      // Send welcome email
      await sendLeadWelcomeEmail({
        id: contactId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        contactType: input.contactType,
      });

      // Notify owner (non-blocking)
      const scoreLabel = input.contactType === "BUYER" ? ` | Timeline: ${input.timeline ?? "unknown"}` : "";
      notifyOwner({
        title: `New ${input.contactType === "AGENT" ? "Agent" : "Lead"}: ${input.firstName} ${input.lastName}`,
        content: `Email: ${input.email} | Phone: ${input.phone}${scoreLabel}${input.message ? `\n\n"${input.message}"` : ""}`,
      }).catch(() => {});

      return { success: true, contactId };
    }),

  /**
   * Protected: list all contacts with optional filters.
   */
  list: protectedProcedure
    .input(
      z.object({
        pipelineStage: pipelineStageEnum.optional(),
        contactType: z.enum(["BUYER", "AGENT"]).optional(),
        leadScore: z.enum(["HOT", "WARM", "COLD"]).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return getContacts(input);
    }),

  /**
   * Protected: get a single contact with activity and email history.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const contact = await getContactById(input.id);
      if (!contact) throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
      const [activity, emails] = await Promise.all([
        getActivityForContact(input.id),
        getEmailsForContact(input.id),
      ]);
      return { contact, activity, emails };
    }),

  /**
   * Protected: update pipeline stage with validation and activity log.
   */
  updateStage: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        stage: pipelineStageEnum,
        lossReason: lossReasonEnum.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await getContactById(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      // SQL stage validation: require verified contact info
      if (input.stage === "SQL") {
        if (!existing.email && !existing.phone) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A verified contact (email or phone) must be present before converting to SQL.",
          });
        }
        const validTimelines = ["ASAP", "1_3_MONTHS", "3_6_MONTHS"];
        if (!existing.timeline || !validTimelines.includes(existing.timeline)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Lead timeline must be ASAP, 1–3 months, or 3–6 months to qualify as SQL.",
          });
        }
      }

      const updateData: Parameters<typeof updateContact>[1] = { pipelineStage: input.stage };
      if (input.stage === "LOST" && input.lossReason) {
        updateData.lossReason = input.lossReason;
      }

      await updateContact(input.id, updateData);

      await logActivity({
        contactId: input.id,
        userId: ctx.user.id,
        activityType: "STAGE_CHANGE",
        description: `Stage changed from ${existing.pipelineStage} → ${input.stage}${input.lossReason ? ` (Reason: ${input.lossReason})` : ""}`,
      });

      return { success: true };
    }),

  /**
   * Protected: add a note to a contact.
   */
  addNote: protectedProcedure
    .input(z.object({ id: z.number(), note: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getContactById(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      // Append to existing notes
      const updatedNotes = existing.notes
        ? `${existing.notes}\n\n[${new Date().toLocaleDateString()}] ${input.note}`
        : `[${new Date().toLocaleDateString()}] ${input.note}`;

      await updateContact(input.id, { notes: updatedNotes });
      await logActivity({
        contactId: input.id,
        userId: ctx.user.id,
        activityType: "NOTE_ADDED",
        description: input.note,
      });

      return { success: true };
    }),

  /**
   * Protected: update contact fields (editable from detail view).
   */
  updateContact: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        timeline: timelineEnum.optional(),
        priceRangeMin: z.number().optional(),
        priceRangeMax: z.number().optional(),
        financingStatus: financingEnum.optional(),
        lenderName: z.string().optional(),
        brokerageName: z.string().optional(),
        licenseNumber: z.string().optional(),
        tourDate: z.date().optional(),
        source: z.enum(["WEBSITE","ZILLOW","MLS","REFERRAL","AGENT","BILLBOARD","WALK_IN","OTHER"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await getContactById(id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      await updateContact(id, data);
      await logActivity({
        contactId: id,
        userId: ctx.user.id,
        activityType: "NOTE_ADDED",
        description: `Contact record updated: ${Object.keys(data).join(", ")}`,
      });

      return { success: true };
    }),

  /**
   * Protected: dashboard stats — stage counts + new leads this week.
   */
  dashboardStats: protectedProcedure.query(async () => {
    const [stageCounts, newLeadsThisWeek] = await Promise.all([
      getStageCounts(),
      getNewLeadsThisWeek(),
    ]);
    return { stageCounts, newLeadsThisWeek };
  }),
});
