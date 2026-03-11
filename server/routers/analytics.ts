/**
 * Analytics router — fetches website traffic stats from Plausible Analytics API.
 *
 * Plausible Stats API v2 docs: https://plausible.io/docs/stats-api
 *
 * Required env var: PLAUSIBLE_API_KEY (Bearer token from plausible.io/settings/api-keys)
 * Site domain:      apollohomebuilders.com
 *
 * If the API key is not yet configured, the procedure returns null values so the
 * CRM dashboard can render a "Connect Plausible" placeholder instead of crashing.
 */

import { protectedProcedure, router } from "../_core/trpc";

const PLAUSIBLE_BASE = "https://plausible.io/api/v2";
const SITE_ID = "apollohomebuilders.com";

interface PlausibleTimeseries {
  results: { date: string; visitors: number; pageviews: number }[];
}

interface PlausibleBreakdown {
  results: { source: string; visitors: number }[];
}

interface PlausibleAggregate {
  results: {
    visitors: { value: number };
    pageviews: { value: number };
    bounce_rate: { value: number };
    visit_duration: { value: number };
  };
}

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

export const analyticsRouter = router({
  /**
   * Protected: fetch last-7-day website traffic stats from Plausible.
   * Returns null fields when the API key is not configured.
   */
  trafficStats: protectedProcedure.query(async () => {
    const apiKey = process.env.PLAUSIBLE_API_KEY;

    if (!apiKey) {
      return {
        configured: false,
        visitors7d: null,
        pageviews7d: null,
        bounceRate: null,
        avgVisitDuration: null,
        topSource: null,
        topSourceVisitors: null,
        dailyTimeseries: null,
      };
    }

    try {
      const period = "7d";

      const [aggregate, breakdown] = await Promise.all([
        plausibleFetch<PlausibleAggregate>(
          `/stats/aggregate?site_id=${SITE_ID}&period=${period}&metrics=visitors,pageviews,bounce_rate,visit_duration`,
          apiKey
        ),
        plausibleFetch<PlausibleBreakdown>(
          `/stats/breakdown?site_id=${SITE_ID}&period=${period}&property=visit:source&metrics=visitors&limit=1`,
          apiKey
        ),
      ]);

      const top = breakdown.results[0] ?? null;

      return {
        configured: true,
        visitors7d: aggregate.results.visitors.value,
        pageviews7d: aggregate.results.pageviews.value,
        bounceRate: aggregate.results.bounce_rate.value,
        avgVisitDuration: aggregate.results.visit_duration.value,
        topSource: top?.source ?? null,
        topSourceVisitors: top?.visitors ?? null,
        dailyTimeseries: null, // timeseries endpoint requires paid plan; reserved for future use
      };
    } catch (err) {
      console.error("[analyticsRouter] Plausible fetch failed:", err);
      return {
        configured: true,
        visitors7d: null,
        pageviews7d: null,
        bounceRate: null,
        avgVisitDuration: null,
        topSource: null,
        topSourceVisitors: null,
        dailyTimeseries: null,
      };
    }
  }),
});
