/**
 * Settings router — read/write configurable system settings.
 * Exposes:
 *   - staleLeadThresholdHours: hours before a lead is flagged as overdue
 *   - staleAlertEnabled: whether Resend email alerts fire on stale leads
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { Resend } from "resend";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { systemSettings, adminCredentials } from "../../drizzle/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

export const STALE_THRESHOLD_KEY = "staleLeadThresholdHours";
export const STALE_ALERT_KEY = "staleAlertEnabled";
export const DEFAULT_STALE_HOURS = 48;

/** Returns the stale lead threshold in hours (defaults to 48 if not set). */
export async function getStaleThresholdHours(): Promise<number> {
  const db = await getDb();
  if (!db) return DEFAULT_STALE_HOURS;
  const rows = await db
    .select({ value: systemSettings.value })
    .from(systemSettings)
    .where(eq(systemSettings.key, STALE_THRESHOLD_KEY));
  if (rows.length === 0) return DEFAULT_STALE_HOURS;
  const parsed = parseInt(rows[0].value, 10);
  return isNaN(parsed) || parsed < 1 ? DEFAULT_STALE_HOURS : parsed;
}

/** Returns whether stale-lead email alerts are enabled (defaults to true). */
export async function getStaleAlertEnabled(): Promise<boolean> {
  const db = await getDb();
  if (!db) return true;
  const rows = await db
    .select({ value: systemSettings.value })
    .from(systemSettings)
    .where(eq(systemSettings.key, STALE_ALERT_KEY));
  if (rows.length === 0) return true;
  return rows[0].value !== "false";
}

export const settingsRouter = router({
  /** Get the current stale lead threshold (hours). */
  getStaleThreshold: protectedProcedure.query(async () => {
    return { hours: await getStaleThresholdHours() };
  }),

  /** Update the stale lead threshold (hours). Min 1, max 720 (30 days). */
  setStaleThreshold: protectedProcedure
    .input(z.object({ hours: z.number().int().min(1).max(720) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db
        .insert(systemSettings)
        .values({ key: STALE_THRESHOLD_KEY, value: String(input.hours) })
        .onDuplicateKeyUpdate({ set: { value: String(input.hours) } });
      return { hours: input.hours };
    }),

  /** Get whether stale-lead email alerts are enabled. */
  getStaleAlertEnabled: protectedProcedure.query(async () => {
    return { enabled: await getStaleAlertEnabled() };
  }),

  /** Enable or disable stale-lead email alerts. */
  setStaleAlertEnabled: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db
        .insert(systemSettings)
        .values({ key: STALE_ALERT_KEY, value: input.enabled ? "true" : "false" })
        .onDuplicateKeyUpdate({ set: { value: input.enabled ? "true" : "false" } });
      return { enabled: input.enabled };
    }),

  /** Get the current admin's per-rep alert preference. */
  getMyAlertPref: protectedProcedure.query(async ({ ctx }) => {
    const email = ctx.user?.email;
    if (!email) return { receiveStaleAlerts: true };
    const db = await getDb();
    if (!db) return { receiveStaleAlerts: true };
    const rows = await db
      .select({ receiveStaleAlerts: adminCredentials.receiveStaleAlerts })
      .from(adminCredentials)
      .where(eq(adminCredentials.email, email.toLowerCase()))
      .limit(1);
    return { receiveStaleAlerts: rows[0]?.receiveStaleAlerts ?? true };
  }),

  /** Update the current admin's per-rep alert preference. */
  setMyAlertPref: protectedProcedure
    .input(z.object({ receiveStaleAlerts: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const email = ctx.user?.email;
      if (!email) throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db
        .update(adminCredentials)
        .set({ receiveStaleAlerts: input.receiveStaleAlerts })
        .where(eq(adminCredentials.email, email.toLowerCase()));
      return { receiveStaleAlerts: input.receiveStaleAlerts };
    }),

  /**
   * Send a test stale-lead alert email to the currently logged-in rep.
   * Useful for verifying Resend delivery before the cron fires.
   */
  sendTestAlert: protectedProcedure.mutation(async ({ ctx }) => {
    const email = ctx.user?.email;
    const name = ctx.user?.name ?? "Rep";
    if (!email) throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });

    const { error } = await resend.emails.send({
      from: "Apollo SCOPS <hello@apollohomebuilders.com>",
      to: email,
      subject: "[Test] Stale Lead Alert — Apollo SCOPS",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
          <h2 style="color:#0f2044;margin-bottom:8px;">🔔 Stale Lead Alert (Test)</h2>
          <p style="color:#374151;font-size:15px;line-height:1.6;">Hi ${name},</p>
          <p style="color:#374151;font-size:15px;line-height:1.6;">
            This is a <strong>test email</strong> from Apollo SCOPS to confirm that stale-lead
            alerts are correctly routed to your inbox.
          </p>
          <p style="color:#374151;font-size:15px;line-height:1.6;">
            When a real lead's <em>Next Action Due</em> date passes without an update,
            you'll receive an email like this one listing the overdue leads and their
            assigned stages.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
          <p style="color:#9ca3af;font-size:12px;">Apollo SCOPS · Pahrump, NV · This is an automated test message.</p>
        </div>
      `,
    });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to send test alert: ${error.message}`,
      });
    }

    return { sent: true, to: email };
  }),
});
