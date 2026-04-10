/**
 * Analytics router — fetches website traffic stats from Plausible Analytics API v1.
 *
 * Plausible Stats API v1 docs: https://plausible.io/docs/stats-api
 *
 * Required env var: PLAUSIBLE_API_KEY (Bearer token from plausible.io/settings/api-keys)
 * Site domain:      apollohomebuilders.com
 *
 * If the API key is not yet configured, the procedure returns null values so the
 * CRM dashboard can render a "Connect Plausible" placeholder instead of crashing.
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { floorPlanRequests, listingAlertSubscribers, lotAnalysisRequests, newsletterSubscribers } from "../../drizzle/schema";
import { sql } from "drizzle-orm";

const PLAUSIBLE_BASE = "https://plausible.io/api/v1";
const SITE_ID = "apollohomebuilders.com";

async function plausibleFetch<T>(path: string, apiKey: string): Promise<T> {
  const url = `${PLAUSIBLE_BASE}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Plausible API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

interface AggregateResult {
  results: {
    visitors: { value: number };
    pageviews: { value: number };
    bounce_rate: { value: number };
    visit_duration: { value: number };
  };
}

interface BreakdownResult {
  results: { page?: string; source?: string; visitors: number }[];
}

interface TimeseriesResult {
  results: { date: string; visitors: number; pageviews: number }[];
}

// Lead magnet page paths to track
const LEAD_MAGNET_PAGES = [
  { path: "/buyers-guide",           label: "Home Buyer's Guide",       icon: "📖" },
  { path: "/listing-alerts",         label: "Listing Alerts",           icon: "🔔" },
  { path: "/pahrump-vs-las-vegas",   label: "Pahrump vs Las Vegas",     icon: "⚖️" },
  { path: "/free-lot-analysis",      label: "Free Lot Analysis",        icon: "📐" },
  { path: "/floor-plans",            label: "Floor Plans",              icon: "🏠" },
];

export const analyticsRouter = router({
  /**
   * Protected: fetch lead counts from DB for each lead magnet page.
   * Returns counts from floorPlanRequests, listingAlertSubscribers, lotAnalysisRequests, newsletterSubscribers.
   */
  getLeadMagnetLeadCounts: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { floorPlans: 0, listingAlerts: 0, lotAnalysis: 0, buyersGuide: 0 };
    try {
      const [fp, la, lot, ns] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(floorPlanRequests),
        db.select({ count: sql<number>`count(*)` }).from(listingAlertSubscribers),
        db.select({ count: sql<number>`count(*)` }).from(lotAnalysisRequests),
        db.select({ count: sql<number>`count(*)` }).from(newsletterSubscribers),
      ]);
      return {
        floorPlans:    Number(fp[0]?.count ?? 0),
        listingAlerts: Number(la[0]?.count ?? 0),
        lotAnalysis:   Number(lot[0]?.count ?? 0),
        buyersGuide:   Number(ns[0]?.count ?? 0),
      };
    } catch (err) {
      console.error("[analyticsRouter] getLeadMagnetLeadCounts failed:", err);
      return { floorPlans: 0, listingAlerts: 0, lotAnalysis: 0, buyersGuide: 0 };
    }
  }),

  /**
   * Protected: fetch per-page visitor stats for each lead magnet from Plausible.
   * Returns visitors per page for the given period.
   */
  getLeadMagnetStats: protectedProcedure
    .input(z.object({ period: z.enum(["7d", "30d", "month", "6mo", "12mo"]).default("30d") }))
    .query(async ({ input }) => {
      const apiKey = process.env.PLAUSIBLE_API_KEY;
      if (!apiKey) {
        return { configured: false, pages: LEAD_MAGNET_PAGES.map(p => ({ ...p, visitors: null })) };
      }
      try {
        const { period } = input;
        // Fetch breakdown by page for the site
        const breakdown = await plausibleFetch<BreakdownResult>(
          `/stats/breakdown?site_id=${SITE_ID}&period=${period}&property=event:page&metrics=visitors&limit=100`,
          apiKey
        );
        const pageMap: Record<string, number> = {};
        for (const r of breakdown.results) {
          if (r.page) pageMap[r.page] = r.visitors;
        }
        return {
          configured: true,
          pages: LEAD_MAGNET_PAGES.map(p => ({
            ...p,
            visitors: pageMap[p.path] ?? 0,
          })),
        };
      } catch (err) {
        console.error("[analyticsRouter] getLeadMagnetStats failed:", err);
        return { configured: true, pages: LEAD_MAGNET_PAGES.map(p => ({ ...p, visitors: null })) };
      }
    }),

  /**
   * Protected: fetch per-day timeseries for a single lead magnet page from Plausible.
   */
  getLeadMagnetTimeseries: protectedProcedure
    .input(z.object({
      path:   z.string(),
      period: z.enum(["7d", "30d", "month", "6mo", "12mo"]).default("30d"),
    }))
    .query(async ({ input }) => {
      const apiKey = process.env.PLAUSIBLE_API_KEY;
      if (!apiKey) return { configured: false, timeseries: [] };
      try {
        const encoded = encodeURIComponent(input.path);
        const ts = await plausibleFetch<TimeseriesResult>(
          `/stats/timeseries?site_id=${SITE_ID}&period=${input.period}&metrics=visitors&filters=event:page==${encoded}`,
          apiKey
        );
        return { configured: true, timeseries: ts.results };
      } catch (err) {
        console.error("[analyticsRouter] getLeadMagnetTimeseries failed:", err);
        return { configured: true, timeseries: [] };
      }
    }),

  /**
   * Protected: fetch website traffic stats from Plausible.
   * Supports period: "7d" | "30d" | "month" | "6mo" | "12mo"
   */
  trafficStats: protectedProcedure
    .input(z.object({ period: z.enum(["7d", "30d", "month", "6mo", "12mo"]).default("30d") }))
    .query(async ({ input }) => {
      const apiKey = process.env.PLAUSIBLE_API_KEY;

      if (!apiKey) {
        return {
          configured: false,
          visitors: null,
          pageviews: null,
          bounceRate: null,
          avgVisitDuration: null,
          topPages: null,
          topSources: null,
          timeseries: null,
        };
      }

      try {
        const { period } = input;

        const [aggregate, topPages, topSources, timeseries] = await Promise.all([
          plausibleFetch<AggregateResult>(
            `/stats/aggregate?site_id=${SITE_ID}&period=${period}&metrics=visitors,pageviews,bounce_rate,visit_duration`,
            apiKey
          ),
          plausibleFetch<BreakdownResult>(
            `/stats/breakdown?site_id=${SITE_ID}&period=${period}&property=event:page&metrics=visitors&limit=10`,
            apiKey
          ),
          plausibleFetch<BreakdownResult>(
            `/stats/breakdown?site_id=${SITE_ID}&period=${period}&property=visit:source&metrics=visitors&limit=10`,
            apiKey
          ),
          plausibleFetch<TimeseriesResult>(
            `/stats/timeseries?site_id=${SITE_ID}&period=${period}&metrics=visitors,pageviews`,
            apiKey
          ),
        ]);

        return {
          configured: true,
          visitors: aggregate.results.visitors.value,
          pageviews: aggregate.results.pageviews.value,
          bounceRate: aggregate.results.bounce_rate.value,
          avgVisitDuration: aggregate.results.visit_duration.value,
          topPages: topPages.results.map(r => ({ page: r.page ?? "", visitors: r.visitors })),
          topSources: topSources.results.map(r => ({ source: r.source ?? "Direct", visitors: r.visitors })),
          timeseries: timeseries.results,
        };
      } catch (err) {
        console.error("[analyticsRouter] Plausible fetch failed:", err);
        return {
          configured: true,
          visitors: null,
          pageviews: null,
          bounceRate: null,
          avgVisitDuration: null,
          topPages: null,
          topSources: null,
          timeseries: null,
        };
      }
    }),
});
