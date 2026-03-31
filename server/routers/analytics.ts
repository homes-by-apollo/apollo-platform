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

export const analyticsRouter = router({
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
