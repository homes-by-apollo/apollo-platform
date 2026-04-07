import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { getDb } from "../db";
import { adminCredentials } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * superAdminProcedure — requires the caller to be an admin AND have adminRole='super_admin' in adminCredentials.
 * Use for destructive actions: delete lead, delete user, bulk wipe, etc.
 */
export const superAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    // Verify super_admin role from DB (ctx.user.email is the admin's email)
    const db = await getDb();
    if (db) {
      const rows = await db
        .select({ adminRole: adminCredentials.adminRole })
        .from(adminCredentials)
        .where(eq(adminCredentials.email, ctx.user.email ?? ""))
        .limit(1);
      const role = rows[0]?.adminRole;
      if (role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Super Admin access required." });
      }
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
