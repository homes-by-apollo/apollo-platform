/**
 * scheduling.ts — Calendly integration router
 */

import { z } from "zod";
import { eq, desc, gte, and } from "drizzle-orm";
import { getDb } from "../db";
import { scheduledTours, activityLog, scopsTeam } from "../../drizzle/schema";
import { adminProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { TRPCError } from "@trpc/server";
import { sendWeeklyTourDigest } from "../weeklyTourDigest";

// ─── Calendly API helpers ─────────────────────────────────────────────────────

async function getCalendlyUser(): Promise<{ uri: string; name: string } | null> {
  const apiKey = ENV.calendlyApiKey;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.calendly.com/users/me", {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json() as { resource: { uri: string; name: string } };
    return data.resource;
  } catch {
    return null;
  }
}

async function getCalendlyEventTypes() {
  const apiKey = ENV.calendlyApiKey;
  if (!apiKey) return [];
  try {
    const user = await getCalendlyUser();
    if (!user) return [];
    const res = await fetch(
      `https://api.calendly.com/event_types?user=${encodeURIComponent(user.uri)}&active=true`,
      { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
    );
    if (!res.ok) return [];
    const data = await res.json() as {
      collection: Array<{ uri: string; name: string; slug: string; scheduling_url: string }>
    };
    return data.collection ?? [];
  } catch {
    return [];
  }
}

// ─── Tour Confirmation Email ─────────────────────────────────────────────────

/**
 * Generates an iCalendar (.ics) string for a scheduled tour.
 */
function buildIcs(params: {
  uid: string;
  summary: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  organizerEmail: string;
  attendeeEmail: string;
  attendeeName: string;
}): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Homes by Apollo//Tour Scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${params.uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(params.startTime)}`,
    `DTEND:${fmt(params.endTime)}`,
    `SUMMARY:${params.summary}`,
    `DESCRIPTION:${params.description.replace(/\n/g, "\\n")}`,
    `LOCATION:${params.location}`,
    `ORGANIZER;CN=Homes by Apollo:mailto:${params.organizerEmail}`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=${params.attendeeName}:mailto:${params.attendeeEmail}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Sends a tour confirmation email with .ics calendar attachment via Resend.
 */
async function sendTourConfirmationEmail(params: {
  toEmail: string;
  toName: string;
  startTime: Date;
  endTime: Date;
  location: string;
  propertyAddress?: string;
  tourId: string;
}): Promise<void> {
  const resendApiKey = ENV.resendApiKey;
  if (!resendApiKey) {
    console.warn("[TourEmail] RESEND_API_KEY not set — skipping tour confirmation");
    return;
  }

  const dateStr = params.startTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = params.startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  const address = params.propertyAddress ?? params.location ?? "Pahrump, NV";

  const icsContent = buildIcs({
    uid: `tour-${params.tourId}@apollohomebuilders.com`,
    summary: `Home Tour — ${address}`,
    description: `Your home tour with Homes by Apollo has been scheduled.\n\nProperty: ${address}\nDate: ${dateStr}\nTime: ${timeStr}\n\nQuestions? Call us at (775) 910-7771 or visit apollohomebuilders.com`,
    location: address,
    startTime: params.startTime,
    endTime: params.endTime,
    organizerEmail: "hello@apollohomebuilders.com",
    attendeeEmail: params.toEmail,
    attendeeName: params.toName,
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f5f4f0;font-family:'Georgia',serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:48px 0;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <tr><td style="background:#0f2044;padding:36px 48px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.2em;color:rgba(255,255,255,0.45);text-transform:uppercase;">Homes by Apollo</p>
              <p style="margin:0;font-size:28px;font-weight:900;letter-spacing:0.04em;color:white;">APOLLO</p>
            </td></tr>
            <tr><td style="padding:48px 48px 36px;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f2044;">Your Tour is Confirmed</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#666;line-height:1.7;">Hi ${params.toName}, your home tour has been scheduled. We look forward to seeing you!</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;border-radius:10px;margin-bottom:28px;">
                <tr><td style="padding:20px 24px;">
                  <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.1em;color:#999;text-transform:uppercase;">Property</p>
                  <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0f2044;">${address}</p>
                  <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.1em;color:#999;text-transform:uppercase;">Date &amp; Time</p>
                  <p style="margin:0;font-size:16px;font-weight:700;color:#0f2044;">${dateStr} at ${timeStr}</p>
                </td></tr>
              </table>
              <p style="margin:0 0 8px;font-size:14px;color:#666;line-height:1.6;">A calendar invite is attached to this email. Add it to your calendar to get a reminder.</p>
              <p style="margin:0;font-size:14px;color:#666;line-height:1.6;">Questions? Call us at <strong>(775) 910-7771</strong> or visit <a href="https://apollohomebuilders.com" style="color:#c9a84c;">apollohomebuilders.com</a>.</p>
            </td></tr>
            <tr><td style="border-top:1px solid #eee;padding:24px 48px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;">Homes by Apollo &middot; Pahrump, Nevada</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  const icsBase64 = Buffer.from(icsContent).toString("base64");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "hello@apollohomebuilders.com",
      to: [params.toEmail],
      subject: `Your Home Tour is Confirmed — ${dateStr}`,
      html,
      attachments: [{
        filename: "home-tour.ics",
        content: icsBase64,
      }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[TourEmail] Resend error:", res.status, body);
  } else {
    console.log(`[TourEmail] Confirmation sent to ${params.toEmail}`);
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const schedulingRouter = router({

  /** List all scheduled tours */
  list: adminProcedure
    .input(z.object({
      upcoming: z.boolean().optional().default(false),
      limit: z.number().min(1).max(200).optional().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      if (input.upcoming) {
        return db
          .select()
          .from(scheduledTours)
          .where(and(eq(scheduledTours.status, "ACTIVE"), gte(scheduledTours.startTime, new Date())))
          .orderBy(desc(scheduledTours.startTime))
          .limit(input.limit);
      }
      return db
        .select()
        .from(scheduledTours)
        .orderBy(desc(scheduledTours.startTime))
        .limit(input.limit);
    }),

  /** Get a single tour by ID */
  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [tour] = await db
        .select()
        .from(scheduledTours)
        .where(eq(scheduledTours.id, input.id))
        .limit(1);
      if (!tour) throw new TRPCError({ code: "NOT_FOUND" });
      return tour;
    }),

  /** Manually create a tour (phone/walk-in bookings) */
  create: adminProcedure
    .input(z.object({
      inviteeName: z.string().min(1),
      inviteeEmail: z.string().email(),
      inviteePhone: z.string().optional(),
      eventName: z.string().optional().default("Home Tour"),
      startTime: z.date(),
      endTime: z.date(),
      location: z.string().optional(),
      contactId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const manualUri = `manual:${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const [result] = await db.insert(scheduledTours).values({
        calendlyEventUri: manualUri,
        calendlyInviteeUri: `${manualUri}-invitee`,
        inviteeName: input.inviteeName,
        inviteeEmail: input.inviteeEmail,
        inviteePhone: input.inviteePhone,
        eventName: input.eventName,
        startTime: input.startTime,
        endTime: input.endTime,
        location: input.location,
        contactId: input.contactId,
        status: "ACTIVE",
      });

      if (input.contactId) {
        await db.insert(activityLog).values({
          contactId: input.contactId,
          activityType: "TOUR_SCHEDULED",
          description: `Tour manually scheduled for ${input.startTime.toLocaleDateString()} at ${input.startTime.toLocaleTimeString()}`,
        });
      }

      const tourId = String((result as { insertId: number }).insertId);

      // Fire-and-forget tour confirmation email with .ics attachment
      sendTourConfirmationEmail({
        toEmail: input.inviteeEmail,
        toName: input.inviteeName,
        startTime: input.startTime,
        endTime: input.endTime,
        location: input.location ?? "Pahrump, NV",
        tourId,
      }).catch(err => console.error("[TourEmail] Failed to send confirmation:", err));

      return { id: Number(tourId) };
    }),

  /** Cancel a tour */
  cancel: adminProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [tour] = await db
        .select()
        .from(scheduledTours)
        .where(eq(scheduledTours.id, input.id))
        .limit(1);
      if (!tour) throw new TRPCError({ code: "NOT_FOUND" });

      await db.update(scheduledTours)
        .set({ status: "CANCELLED", cancelReason: input.reason ?? null })
        .where(eq(scheduledTours.id, input.id));

      if (tour.contactId) {
        await db.insert(activityLog).values({
          contactId: tour.contactId,
          activityType: "STAGE_CHANGE",
          description: `Tour cancelled${input.reason ? `: ${input.reason}` : ""}`,
        });
      }

      return { success: true };
    }),

  /** Get Calendly event types */
  getEventTypes: adminProcedure
    .query(async () => {
      return getCalendlyEventTypes();
    }),

  /** Check Calendly connection status */
  connectionStatus: adminProcedure
    .query(async () => {
      const apiKey = ENV.calendlyApiKey;
      if (!apiKey) return { connected: false as const, reason: "No API key configured" };
      const user = await getCalendlyUser();
      if (!user) return { connected: false as const, reason: "Invalid API key or Calendly API error" };
      return { connected: true as const, user };
    }),

  /** Dashboard stats */
  stats: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { upcoming: 0, thisWeek: 0, cancelled: 0, total: 0 };

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

      const all = await db.select().from(scheduledTours);
      const upcoming = all.filter(t => t.status === "ACTIVE" && t.startTime > now).length;
      const thisWeek = all.filter(t => t.status === "ACTIVE" && t.startTime >= startOfWeek && t.startTime <= endOfWeek).length;
      const cancelled = all.filter(t => t.status === "CANCELLED").length;

      return { upcoming, thisWeek, cancelled, total: all.length };
    }),

  /** Send the weekly tour digest immediately (manual trigger / test) */
  sendWeeklyDigest: adminProcedure
    .mutation(async () => {
      const result = await sendWeeklyTourDigest();
      return result;
    }),

  /** Get all SCOPS team members */
  getTeam: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(scopsTeam).orderBy(scopsTeam.id);
    }),

  /** Add a team member */
  addTeamMember: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      role: z.enum(["super_admin", "admin", "member"]).default("member"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(scopsTeam).values({
        name: input.name,
        email: input.email,
        role: input.role,
        active: 1,
      });
      return { success: true };
    }),

  /** Toggle a team member active/inactive */
  toggleTeamMember: adminProcedure
    .input(z.object({ id: z.number(), active: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(scopsTeam)
        .set({ active: input.active ? 1 : 0 })
        .where(eq(scopsTeam.id, input.id));
      return { success: true };
    }),
});
