import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { floorPlans, floorPlanRequests, listingAlertSubscribers, lotAnalysisRequests, type FloorPlan } from "../../drizzle/schema";
import { eq, asc } from "drizzle-orm";
import { Resend } from "resend";
import { TRPCError } from "@trpc/server";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "RESEND_API_KEY not configured" });
  return new Resend(key);
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function getAllFloorPlans() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db.select().from(floorPlans).orderBy(asc(floorPlans.sortOrder));
}

async function getFloorPlanBySlug(slug: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const rows = await db.select().from(floorPlans).where(eq(floorPlans.slug, slug)).limit(1);
  return rows[0] ?? null;
}

async function getFloorPlanById(id: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const rows = await db.select().from(floorPlans).where(eq(floorPlans.id, id)).limit(1);
  return rows[0] ?? null;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const floorPlansRouter = router({
  // Public: list all floor plans with optional filters
  getAll: publicProcedure
    .input(z.object({
      beds: z.number().optional(),
      minSqft: z.number().optional(),
      maxSqft: z.number().optional(),
      maxPrice: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const all = await getAllFloorPlans();
      if (!input) return all;
      return all.filter((p: FloorPlan) => {
        if (input.beds && p.beds !== input.beds) return false;
        if (input.minSqft && p.sqft < input.minSqft) return false;
        if (input.maxSqft && p.sqft > input.maxSqft) return false;
        if (input.maxPrice && p.startingPrice && p.startingPrice > input.maxPrice) return false;
        return true;
      });
    }),

  // Public: get a single floor plan by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const plan = await getFloorPlanBySlug(input.slug);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Floor plan not found" });
      return plan;
    }),

  // Public: request a floor plan PDF (lead capture gate)
  requestPdf: publicProcedure
    .input(z.object({
      floorPlanId: z.number(),
      email: z.string().email(),
      name: z.string().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const plan = await getFloorPlanById(input.floorPlanId);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Floor plan not found" });

      // Save the request
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.insert(floorPlanRequests).values({
        floorPlanId: input.floorPlanId,
        email: input.email,
        name: input.name,
        phone: input.phone,
      });

      // Send email with PDF link (or link to floor plan page)
      const pdfLink = plan.pdfUrl ?? `https://apollohomebuilders.com/floor-plans/${plan.slug}`;
      try {
        const resend = getResend();
        await resend.emails.send({
          from: "Homes by Apollo <hello@apollohomebuilders.com>",
          to: input.email,
          subject: `Your Floor Plan: ${plan.name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0f2044;">Your Floor Plan is Ready</h2>
              <p>Hi${input.name ? ` ${input.name}` : ""},</p>
              <p>Thank you for your interest in <strong>${plan.name}</strong> — ${plan.sqft.toLocaleString()} sq ft, ${plan.beds} bed / ${plan.baths} bath.</p>
              <p style="margin: 24px 0;">
                <a href="${pdfLink}" style="background: #0f2044; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  View Floor Plan →
                </a>
              </p>
              <p>Starting from <strong>$${plan.startingPrice ? plan.startingPrice.toLocaleString() : "Contact us"}</strong></p>
              <p>Ready to build on your lot? <a href="https://apollohomebuilders.com/free-lot-analysis">Get a free lot analysis</a> or <a href="https://apollohomebuilders.com/get-in-touch">schedule a consultation</a>.</p>
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
              <p style="color: #888; font-size: 13px;">Homes by Apollo · Pahrump, NV · <a href="https://apollohomebuilders.com">apollohomebuilders.com</a></p>
            </div>
          `,
        });
      } catch (e) {
        // Don't fail the mutation if email fails — the request is already saved
        console.error("[FloorPlan] Email send failed:", e);
      }

      return { success: true, pdfUrl: plan.pdfUrl };
    }),

  // Admin: create a floor plan
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      sqft: z.number(),
      beds: z.number(),
      baths: z.string(),
      garage: z.number().default(2),
      startingPrice: z.number().optional(),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      pdfUrl: z.string().optional(),
      featured: z.boolean().default(false),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [result] = await db.insert(floorPlans).values({
        ...input,
        featured: input.featured ? 1 : 0,
      });
      return { id: (result as any).insertId };
    }),

  // Admin: update a floor plan
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      sqft: z.number().optional(),
      beds: z.number().optional(),
      baths: z.string().optional(),
      garage: z.number().optional(),
      startingPrice: z.number().optional(),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      pdfUrl: z.string().optional(),
      featured: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const { id, featured, ...rest } = input;
      await db.update(floorPlans).set({
        ...rest,
        ...(featured !== undefined ? { featured: featured ? 1 : 0 } : {}),
      }).where(eq(floorPlans.id, id));
      return { success: true };
    }),

  // Admin: delete a floor plan
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.delete(floorPlans).where(eq(floorPlans.id, input.id));
      return { success: true };
    }),

  // Admin: list all PDF requests
  getPdfRequests: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      return db.select().from(floorPlanRequests).orderBy(asc(floorPlanRequests.requestedAt));
    }),

  // Public: subscribe to listing alerts
  subscribeListingAlerts: publicProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().optional(),
      priceMin: z.number().optional(),
      priceMax: z.number().optional(),
      propertyType: z.enum(["HOME", "LOT", "BOTH"]).default("BOTH"),
    }))
    .mutation(async ({ input }) => {
      // Upsert — if email exists, update preferences
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const existing = await db.select().from(listingAlertSubscribers)
        .where(eq(listingAlertSubscribers.email, input.email)).limit(1);

      if (existing.length > 0) {
        await db.update(listingAlertSubscribers).set({
          name: input.name,
          priceMin: input.priceMin,
          priceMax: input.priceMax,
          propertyType: input.propertyType,
          unsubscribedAt: null,
        }).where(eq(listingAlertSubscribers.email, input.email));
      } else {
        await db.insert(listingAlertSubscribers).values({
          email: input.email,
          name: input.name,
          priceMin: input.priceMin,
          priceMax: input.priceMax,
          propertyType: input.propertyType,
        });
      }

      // Send confirmation email
      try {
        const resend = getResend();
        await resend.emails.send({
          from: "Homes by Apollo <hello@apollohomebuilders.com>",
          to: input.email,
          subject: "You're on the list — New Listing Alerts",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0f2044;">You're on the list!</h2>
              <p>Hi${input.name ? ` ${input.name}` : ""},</p>
              <p>We'll notify you the moment a new ${input.propertyType === "BOTH" ? "home or lot" : input.propertyType.toLowerCase()} is listed in Pahrump${input.priceMax ? ` under $${input.priceMax.toLocaleString()}` : ""}.</p>
              <p>In the meantime, <a href="https://apollohomebuilders.com/homes">browse our current listings</a> or <a href="https://apollohomebuilders.com/floor-plans">explore our floor plans</a>.</p>
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
              <p style="color: #888; font-size: 13px;">Homes by Apollo · Pahrump, NV · <a href="https://apollohomebuilders.com/listing-alerts/unsubscribe">Unsubscribe</a></p>
            </div>
          `,
        });
      } catch (e) {
        console.error("[ListingAlerts] Confirmation email failed:", e);
      }

      return { success: true };
    }),

  // Public: submit free lot analysis intake form
  submitLotAnalysis: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      lotAddress: z.string().optional(),
      apn: z.string().optional(),
      goals: z.string().optional(),
      timeline: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.insert(lotAnalysisRequests).values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        lotAddress: input.lotAddress,
        apn: input.apn,
        goals: input.goals,
        timeline: input.timeline,
      });
      try {
        const resend = getResend();
        await resend.emails.send({
          from: "Homes by Apollo <hello@apollohomebuilders.com>",
          to: input.email,
          subject: "Free Lot Analysis \u2014 We'll Review Your Lot Before Your Call",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0f2044;">We received your lot details!</h2>
              <p>Hi ${input.name},</p>
              <p>Our team will review your lot${input.lotAddress ? ` at <strong>${input.lotAddress}</strong>` : ""} before your call so we can give you specific, actionable feedback right away.</p>
              <p><strong>Next step:</strong> Book your free 30-minute consultation using the calendar on the next page.</p>
              <p>Questions? Reply to this email or call us directly.</p>
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
              <p style="color: #888; font-size: 13px;">Homes by Apollo \u00b7 Pahrump, NV</p>
            </div>
          `,
        });
      } catch (e) {
        console.error("[LotAnalysis] Confirmation email failed:", e);
      }
      return { success: true };
    }),

  // Admin: get listing alert subscribers
  getListingAlertSubscribers: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      return db.select().from(listingAlertSubscribers)
        .orderBy(asc(listingAlertSubscribers.subscribedAt));
    }),
});
