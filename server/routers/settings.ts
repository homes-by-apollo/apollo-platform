/**
 * Settings router — read/write configurable system settings.
 * Currently exposes the stale-lead threshold (hours) used by the cron job.
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { systemSettings } from "../../drizzle/schema";

export const STALE_THRESHOLD_KEY = "staleLeadThresholdHours";
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
});
