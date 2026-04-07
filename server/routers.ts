import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { adminAuthRouter } from "./routers/adminAuth";
import { dashboardRouter } from "./routers/dashboard";
import { analyticsRouter } from "./routers/analytics";
import { blogRouter } from "./routers/blog";
import { leadsRouter } from "./routers/leads";
import { newsletterRouter } from "./routers/newsletter";
import { propertiesRouter } from "./routers/properties";
import { schedulingRouter } from "./routers/scheduling";
import { pipelineRouter } from "./routers/pipeline";
import { settingsRouter } from "./routers/settings";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  adminAuth: adminAuthRouter,
  dashboard: dashboardRouter,
  analytics: analyticsRouter,
  blog: blogRouter,
  leads: leadsRouter,
  pipeline: pipelineRouter,
  newsletter: newsletterRouter,
  properties: propertiesRouter,
  scheduling: schedulingRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
