import {
  getAbsorptionRate,
  getDealsAtRisk,
  getInventoryHealth,
  getInventoryStats,
  getPipelineInsights,
  getPipelineKanban,
  getRecentActivity,
  getRevenueForecast,
  getSourcePerformance,
  getToursThisWeek,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const dashboardRouter = router({
  /**
   * Protected: all data needed for the SCOPS command-center dashboard.
   * Fetched in parallel for performance.
   */
  overview: protectedProcedure.query(async () => {
    const [
      inventoryStats,
      toursThisWeek,
      absorptionRate,
      revenueForecast,
      dealsAtRisk,
      inventoryHealth,
      sourcePerformance,
      recentActivity,
    ] = await Promise.all([
      getInventoryStats(),
      getToursThisWeek(),
      getAbsorptionRate(),
      getRevenueForecast(),
      getDealsAtRisk(),
      getInventoryHealth(),
      getSourcePerformance(),
      getRecentActivity(15),
    ]);

    return {
      inventoryStats,
      toursThisWeek,
      absorptionRate,
      revenueForecast,
      dealsAtRisk,
      inventoryHealth,
      sourcePerformance,
      recentActivity,
    };
  }),

  /** Protected: all leads for the kanban pipeline board */
  pipelineKanban: protectedProcedure.query(async () => {
    return getPipelineKanban();
  }),

  /** Protected: aggregate pipeline insights strip */
  pipelineInsights: protectedProcedure.query(async () => {
    return getPipelineInsights();
  }),
});
