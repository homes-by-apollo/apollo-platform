/**
 * scheduling.ts — Calendly integration router
 */

import { z } from "zod";
import { eq, desc, gte, and } from "drizzle-orm";
import { getDb } from "../db";
import { scheduledTours, activityLog } from "../../drizzle/schema";
import { adminProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { TRPCError } from "@trpc/server";

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

      return { id: (result as { insertId: number }).insertId };
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
});
