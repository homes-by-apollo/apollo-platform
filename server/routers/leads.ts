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
  getSourceCounts,
  getStageCounts,
  getUtmSourceCounts,
  calculateLeadScore,
  logActivity,
  logEmail,
  updateContact,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { sendQuoSms } from "../_core/quo";
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
  "NEW_INQUIRY", "QUALIFIED",
  "TOUR_SCHEDULED", "TOURED",
  "OFFER_SUBMITTED", "UNDER_CONTRACT", "CLOSED", "LOST",
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
      : "We received your request — Homes by Apollo";

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #0f2044; padding: 32px 40px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">HOMES BY APOLLO</h1>
        <p style="color: rgba(255,255,255,0.6); font-size: 13px; margin: 4px 0 0;">Pahrump, Nevada</p>
      </div>
      <div style="padding: 40px; border: 1px solid #e8ecf0; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #0f2044; font-size: 16px; font-weight: 600; margin: 0 0 20px;">Hi ${contact.firstName},</p>
        <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
          Thanks for reaching out to <strong>Homes by Apollo</strong>.
        </p>
        <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
          We received your request and one of our team members will be in touch shortly (typically within a few hours during business hours).
        </p>
        ${contact.contactType === "BUYER" ? `
        <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
          In the meantime, you can explore available homes and lots here:<br>
          <a href="https://apollohomebuilders.com" style="color: #0f2044; font-weight: 700;">👉 apollohomebuilders.com</a>
        </p>
        <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
          If you'd rather move faster, you can reply directly to this email or call/text us anytime.
        </p>
        <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 28px;">
          We're here to help you find the right home, timeline, and financing option without the pressure.
        </p>
        ` : `
        <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
          We look forward to discussing our agent partnership program and how we can work together to serve your clients in Pahrump, Nevada.
        </p>
        `}
        <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 28px;">Looking forward to connecting,</p>
        <hr style="border: none; border-top: 1px solid #e8ecf0; margin: 28px 0;">
        <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
          <strong>Brandon Stavros</strong><br>
          Homes by Apollo<br>
          (775) 910-7771
        </p>
        ${contact.contactType === "BUYER" ? `
        <p style="color: #6b7280; font-size: 13px; font-style: italic; margin: 20px 0 0; padding: 16px; background: #f9fafb; border-radius: 6px; border-left: 3px solid #e8ecf0;">
          p.s. Want to see what's available right now? Just reply "homes" and we'll send you current options.
        </p>
        ` : ""}
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
   * Accepts a simplified payload from the Get In Touch 2-step form.
   * Creates a contact record, sends welcome email to lead,
   * and sends a SCOPS alert to ops@apollohomebuilders.com via Resend.
   * No Manus notifyOwner — SCOPS is the single source of truth.
   */
  submit: publicProcedure
    .input(
      z.object({
        // Step 1: name + phone OR email
        name: z.string().min(1, "Name is required"),
        email: z.string().email().optional().or(z.literal("")).transform(v => v || undefined),
        phone: z.string().optional(),
        // Step 2: preferences
        timeline: timelineEnum.optional(),
        price_range: z.string().optional(),   // raw string e.g. "300_400"
        financing: z.string().optional(),     // raw string e.g. "PRE_APPROVED"
        message: z.string().optional(),
        // Source tracking
        source: z.string().optional().default("website_get_in_touch"),
        stage: z.string().optional().default("New Inquiry"),
        // UTM attribution
        utmSource: z.string().max(128).optional(),
        utmMedium: z.string().max(128).optional(),
        utmCampaign: z.string().max(256).optional(),
        utmContent: z.string().max(256).optional(),
        utmTerm: z.string().max(256).optional(),
        landingPage: z.string().max(64).optional(),
      }).refine(d => !!(d.email || d.phone), {
        message: "Either email or phone is required",
        path: ["email"],
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Rate-limit: 5 submissions per IP per hour
      const ip = getClientIp(ctx.req as any);
      checkRateLimit(ip);

      // Parse name into firstName / lastName
      const nameParts = input.name.trim().split(/\s+/);
      const firstName = nameParts[0] ?? input.name;
      const lastName = nameParts.slice(1).join(" ") || firstName;

      // Normalise email: if only phone provided, use a placeholder
      const email = input.email || `${(input.phone ?? "").replace(/\D/g, "")}@noemail.local`;
      const phone = input.phone ?? "";

      // Map price_range string → numeric min/max
      const priceMap: Record<string, [number, number]> = {
        "300_400": [300000, 400000],
        "400_500": [400000, 500000],
        "500_600": [500000, 600000],
        "600_plus": [600000, 999999],
      };
      const [priceRangeMin, priceRangeMax] = input.price_range
        ? (priceMap[input.price_range] ?? [undefined, undefined])
        : [undefined, undefined];

      // Map financing string → enum value
      const validFinancing = ["PRE_APPROVED", "IN_PROCESS", "NOT_STARTED", "CASH_BUYER"] as const;
      const financingStatus = validFinancing.includes(input.financing as any)
        ? (input.financing as typeof validFinancing[number])
        : undefined;

      const contactId = await createContact({
        contactType: "BUYER",
        firstName,
        lastName,
        email,
        phone,
        timeline: input.timeline,
        priceRangeMin,
        priceRangeMax,
        financingStatus,
        source: "WEBSITE",
        pipelineStage: "NEW_INQUIRY",
        utmSource: input.utmSource ?? null,
        utmMedium: input.utmMedium ?? null,
        utmCampaign: input.utmCampaign ?? null,
        utmContent: input.utmContent ?? null,
        utmTerm: input.utmTerm ?? null,
        landingPage: input.landingPage ?? null,
      });

      // Log the form submission activity
      await logActivity({
        contactId,
        activityType: "FORM_SUBMITTED",
        description: `New buyer lead submitted via website Get In Touch form.${input.message ? ` Message: "${input.message}"` : ""}`,
      });

      // Send welcome email to lead (only if real email provided)
      if (input.email) {
        await sendLeadWelcomeEmail({
          id: contactId,
          firstName,
          lastName,
          email: input.email,
          contactType: "BUYER",
        });
      }

      // ── SCOPS internal alert (replaces Manus notifyOwner) ─────────────────
      // Send a notification email to ops@apollohomebuilders.com via Resend.
      // This is the only notification channel — no Manus dependency.
      const timelineLabel = input.timeline ? ` | Timeline: ${input.timeline}` : "";
      const priceLabel = input.price_range ? ` | Budget: ${input.price_range.replace("_", "–")}` : "";
      const finLabel = input.financing ? ` | Financing: ${input.financing}` : "";
      const utmLabel = input.utmSource ? ` | UTM: ${input.utmSource}/${input.utmMedium ?? "(none)"}` : "";
      resend.emails.send({
        from: "SCOPS Alerts <hello@apollohomebuilders.com>",
        to: ["ops@apollohomebuilders.com"],
        subject: (() => {
          const parts: string[] = [`New Lead \u2014 ${firstName} ${lastName}`];
          if (input.price_range) {
            const priceLabels: Record<string, string> = {
              "300_400": "$300\u2013400K", "400_500": "$400\u2013500K",
              "500_600": "$500\u2013600K", "600_plus": "$600K+",
            };
            parts.push(priceLabels[input.price_range] ?? input.price_range);
          }
          if (input.timeline) {
            const tlLabels: Record<string, string> = {
              "ASAP": "ASAP", "1_3_MONTHS": "1\u20133 mo", "3_6_MONTHS": "3\u20136 mo",
              "6_12_MONTHS": "6\u201312 mo", "JUST_BROWSING": "Just browsing",
            };
            parts.push(tlLabels[input.timeline] ?? input.timeline);
          }
          return parts.join(" \u00b7 ");
        })(),
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f7f8fb">
            <h2 style="color:#0f2044;margin:0 0 16px">New Lead — SCOPS</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:6px 0;color:#6b7280;width:120px">Name</td><td style="padding:6px 0;font-weight:600;color:#111827">${firstName} ${lastName}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Email</td><td style="padding:6px 0;color:#111827">${input.email || "—"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Phone</td><td style="padding:6px 0;color:#111827">${phone || "—"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Timeline</td><td style="padding:6px 0;color:#111827">${input.timeline ?? "—"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Budget</td><td style="padding:6px 0;color:#111827">${input.price_range?.replace("_", "–") ?? "—"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Financing</td><td style="padding:6px 0;color:#111827">${input.financing ?? "—"}</td></tr>
              ${input.message ? `<tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">Message</td><td style="padding:6px 0;color:#111827">${input.message}</td></tr>` : ""}
              ${input.utmSource ? `<tr><td style="padding:6px 0;color:#6b7280">UTM</td><td style="padding:6px 0;color:#111827">${utmLabel.replace(" | UTM: ", "")}</td></tr>` : ""}
            </table>
            <p style="margin:20px 0 0;font-size:13px;color:#9ca3af">Source: ${input.source}${timelineLabel}${priceLabel}${finLabel}</p>
            <a href="https://apollodash-mwvy9am3.manus.space/crm" style="display:inline-block;margin-top:16px;background:#0f2044;color:white;padding:10px 20px;border-radius:6px;font-size:13px;font-weight:700;text-decoration:none">View in SCOPS →</a>
          </div>`,
      }).catch((err: unknown) => console.error("[SCOPS Alert] Resend failed:", err));

      // ── Quo HOT lead SMS alert ─────────────────────────────────────────────
      // If the lead is HOT and provided a phone number, fire an immediate
      // SMS to the Apollo business number so the team can respond within seconds.
      const computedScore = calculateLeadScore(
        input.timeline as any ?? null,
        input.financing as any ?? null,
        priceRangeMin,
        priceRangeMax
      );
      if (computedScore === "HOT" && phone) {
        const priceLabels: Record<string, string> = {
          "300_400": "$300-400K", "400_500": "$400-500K",
          "500_600": "$500-600K", "600_plus": "$600K+",
        };
        const tlLabels: Record<string, string> = {
          "ASAP": "ASAP", "1_3_MONTHS": "1-3 mo", "3_6_MONTHS": "3-6 mo",
          "6_12_MONTHS": "6-12 mo", "JUST_BROWSING": "Just browsing",
        };

        // Internal team alert to the Quo business number
        const teamSms = [
          `Hot lead just came in: ${firstName} ${lastName}`,
          input.timeline ? `Timeline: ${tlLabels[input.timeline] ?? input.timeline}` : null,
          input.price_range ? `Budget: ${priceLabels[input.price_range] ?? input.price_range}` : null,
          input.financing ? `Financing: ${input.financing.replace(/_/g, " ")}` : null,
          phone ? `Phone: ${phone}` : null,
          input.email ? `Email: ${input.email}` : null,
          `View: https://apollodash-mwvy9am3.manus.space/crm/${contactId}`,
        ].filter(Boolean).join("\n");
        sendQuoSms(phone, teamSms).catch((err: unknown) =>
          console.error("[Quo] HOT lead team SMS failed:", err)
        );

        // Outbound auto-reply to the lead
        const leadReply = `Hi ${firstName}, this is Kyle with Homes by Apollo. Just saw your inquiry and wanted to reach out personally. We have a few homes available right now in Pahrump that might be a great fit. When is a good time to connect this week?`;
        sendQuoSms(phone, leadReply).catch((err: unknown) =>
          console.error("[Quo] HOT lead auto-reply SMS failed:", err)
        );
      }

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

      // QUALIFIED stage validation: require verified contact info
      if (input.stage === "QUALIFIED") {
        if (!existing.email && !existing.phone) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A verified contact (email or phone) must be present before qualifying a lead.",
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
   * Protected: dashboard stats — stage counts + new leads this week + source breakdown.
   */
  dashboardStats: protectedProcedure
    .input(z.object({ sourcePeriod: z.enum(["7d", "30d", "all"]).optional().default("all") }))
    .query(async ({ input }) => {
      const [stageCounts, newLeadsThisWeek, sourceCounts] = await Promise.all([
        getStageCounts(),
        getNewLeadsThisWeek(),
        getSourceCounts(input.sourcePeriod),
      ]);
      return { stageCounts, newLeadsThisWeek, sourceCounts };
    }),

  /**
   * Protected: UTM attribution breakdown — source/medium/campaign counts.
   */
  utmStats: protectedProcedure
    .input(z.object({ period: z.enum(["7d", "30d", "all"]).optional().default("all") }))
    .query(async ({ input }) => {
      const rows = await getUtmSourceCounts(input.period);
      return rows;
    }),

  /**
   * Protected: resend the welcome email to a specific contact.
   */
  resendWelcome: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const contact = await getContactById(input.id);
      if (!contact) throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });

      const isBuyer = contact.contactType === "BUYER";
      const subject = isBuyer
        ? "Welcome to Apollo Home Builders — We'll Be in Touch Soon"
        : "Thanks for Connecting — Apollo Home Builders";

      const html = isBuyer
        ? `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#f7f8fb">
  <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-logo_31888db6.webp" alt="Apollo Home Builders" style="height:48px;margin-bottom:24px" />
  <h2 style="color:#0f2044;margin:0 0 12px">Hi ${contact.firstName},</h2>
  <p style="color:#374151;line-height:1.6">Thank you for reaching out to Apollo Home Builders. We've received your inquiry and one of our team members will be in touch within 1 business day.</p>
  <p style="color:#374151;line-height:1.6">In the meantime, feel free to explore our available homes and lots at <a href="https://apollohomebuilders.com/find-your-home" style="color:#0f2044">apollohomebuilders.com</a>.</p>
  <p style="color:#374151;line-height:1.6">We look forward to helping you build your dream home in Pahrump.</p>
  <p style="color:#374151;margin-top:24px">Warm regards,<br/><strong>Brandon Cobb</strong><br/>Apollo Home Builders<br/><a href="tel:7025551234" style="color:#0f2044">(702) 555-1234</a></p>
</div>`
        : `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#f7f8fb">
  <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-logo_31888db6.webp" alt="Apollo Home Builders" style="height:48px;margin-bottom:24px" />
  <h2 style="color:#0f2044;margin:0 0 12px">Hi ${contact.firstName},</h2>
  <p style="color:#374151;line-height:1.6">Thank you for connecting with Apollo Home Builders. We appreciate your interest in our new construction projects in Pahrump, NV.</p>
  <p style="color:#374151;line-height:1.6">A member of our team will reach out shortly to discuss how we can work together.</p>
  <p style="color:#374151;margin-top:24px">Warm regards,<br/><strong>Brandon Cobb</strong><br/>Apollo Home Builders</p>
</div>`;

      const { error } = await resend.emails.send({
        from: "Brandon Cobb <brandon@apollohomebuilders.com>",
        to: contact.email,
        subject,
        html,
      });

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      await logEmail({
        contactId: contact.id,
        templateId: "welcome-resend",
        subject,
        toEmail: contact.email,
        status: "SENT",
      });
       await logActivity({
        contactId: contact.id,
        activityType: "EMAIL_SENT",
        description: `Welcome email re-sent manually by admin`,
      });
      return { success: true };
    }),

  /** Send a bulk email to all leads in a given pipeline stage */
  sendBulkEmail: protectedProcedure
    .input(z.object({
      stage: z.string(),
      subject: z.string().min(1).max(200),
      body: z.string().min(1).max(5000),
    }))
    .mutation(async ({ input }) => {
      // Get all contacts in this stage
      const contacts = await getContacts({ pipelineStage: input.stage as "NEW_INQUIRY" | "QUALIFIED" | "TOUR_SCHEDULED" | "TOURED" | "OFFER_SUBMITTED" | "UNDER_CONTRACT" | "CLOSED" | "LOST" });
      if (contacts.length === 0) return { sent: 0, failed: 0 };

      let sent = 0;
      let failed = 0;

      for (const contact of contacts) {
        const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#fff">
  <img src="https://cdn.builder.io/api/v1/image/assets/TEMP/apollo-logo.png" alt="Homes by Apollo" style="height:40px;margin-bottom:24px" />
  <div style="color:#111827;line-height:1.7;font-size:15px;white-space:pre-wrap">${input.body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0" />
  <p style="color:#9ca3af;font-size:12px">Apollo Home Builders · Pahrump, NV · (775) 910-7771</p>
  <p style="color:#9ca3af;font-size:11px">You are receiving this because you expressed interest in our homes. <a href="#" style="color:#6b7280">Unsubscribe</a></p>
</div>`;

        try {
          const { error } = await resend.emails.send({
            from: "Apollo Home Builders <hello@apollohomebuilders.com>",
            to: contact.email,
            subject: input.subject,
            html,
          });
          if (error) { failed++; continue; }
          await logEmail({
            contactId: contact.id,
            templateId: "bulk-stage-blast",
            subject: input.subject,
            toEmail: contact.email,
            status: "SENT",
          });
          await logActivity({
            contactId: contact.id,
            activityType: "EMAIL_SENT",
            description: `Stage blast email sent: "${input.subject}"`,
          });
          sent++;
        } catch {
          failed++;
        }
      }

      return { sent, failed };
    }),

  /**
   * Lead funnel: returns each pipeline stage with count and step-to-step conversion %.
   * Used by the SCOPS Marketing tab funnel chart.
   */
  getFunnel: protectedProcedure.query(async () => {
    const stageCounts = await getStageCounts();
    const STAGES: Array<{ key: string; label: string }> = [
      { key: "NEW_INQUIRY",      label: "New Inquiry" },
      { key: "QUALIFIED",        label: "Qualified" },
      { key: "TOUR_SCHEDULED",   label: "Tour Scheduled" },
      { key: "TOURED",           label: "Toured" },
      { key: "OFFER_SUBMITTED",  label: "Offer Submitted" },
      { key: "UNDER_CONTRACT",   label: "Under Contract" },
      { key: "CLOSED",           label: "Closed" },
    ];
    const countMap = Object.fromEntries(
      stageCounts.map(r => [r.stage, r.count])
    );
    const rows = STAGES.map(s => ({
      stage: s.key,
      label: s.label,
      count: countMap[s.key] ?? 0,
    }));
    // Compute step-to-step conversion: count[i] / count[i-1]
    const funnel = rows.map((row, i) => ({
      ...row,
      conversionRate: i === 0 || rows[i - 1].count === 0
        ? null
        : Math.round((row.count / rows[i - 1].count) * 100),
    }));
    return funnel;
  }),

  /**
   * Public: log a PDF download event against a CRM contact matched by email.
   * Called from the Thank You page when the buyer clicks "Download PDF Now".
   * Silently succeeds even if no matching contact is found (no error thrown).
   */
  trackPdfDownload: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      // Find the contact by email using the same getDb() pattern as other helpers
      const { getDb } = await import("../db");
      const { contacts } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return { tracked: false };
      const rows = await db
        .select({ id: contacts.id })
        .from(contacts)
        .where(eq(contacts.email, input.email.toLowerCase()))
        .limit(1);
      if (rows.length === 0) return { tracked: false };
      const contactId = rows[0].id;
      await logActivity({
        contactId,
        activityType: "PDF_DOWNLOADED",
        description: `Buyer downloaded the 2026 Pahrump Home Buyer's Guide PDF.`,
      });
      return { tracked: true };
    }),
});
