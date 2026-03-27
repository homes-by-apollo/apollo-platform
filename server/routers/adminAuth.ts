import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { getDb } from "../db";
import { adminCredentials } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

const ADMIN_COOKIE = "apollo_admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  return new TextEncoder().encode(ENV.cookieSecret || "apollo-admin-secret-fallback");
}

async function signAdminToken(email: string, name: string) {
  return new SignJWT({ email, name, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { email: string; name: string; role: string };
  } catch {
    return null;
  }
}

/**
 * Ensure the two admin accounts exist in the DB.
 * Passwords come from env vars: ADMIN_KYLE_HASH and ADMIN_BRANDON_HASH.
 * If the env var is not set, that admin cannot log in yet.
 */
async function seedAdmins() {
  const db = await getDb();
  if (!db) return;

  const admins = [
    { email: "kyle@apollohomebuilders.com", name: "Kyle", hashEnv: process.env.ADMIN_KYLE_HASH },
    { email: "brandon@apollohomebuilders.com", name: "Brandon", hashEnv: process.env.ADMIN_BRANDON_HASH },
  ];

  for (const admin of admins) {
    if (!admin.hashEnv) continue;
    const existing = await db.select().from(adminCredentials).where(eq(adminCredentials.email, admin.email)).limit(1);
    if (existing.length === 0) {
      await db.insert(adminCredentials).values({
        email: admin.email,
        name: admin.name,
        passwordHash: admin.hashEnv,
      });
    } else if (existing[0].passwordHash !== admin.hashEnv) {
      await db.update(adminCredentials)
        .set({ passwordHash: admin.hashEnv })
        .where(eq(adminCredentials.email, admin.email));
    }
  }
}

export const adminAuthRouter = router({
  /** Returns the currently logged-in admin from cookie, or null */
  me: publicProcedure.query(async ({ ctx }) => {
    const token = ctx.req.cookies?.[ADMIN_COOKIE];
    if (!token) return null;
    const payload = await verifyAdminToken(token);
    return payload ?? null;
  }),

  /** Email + password login */
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      await seedAdmins();

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const [admin] = await db
        .select()
        .from(adminCredentials)
        .where(eq(adminCredentials.email, input.email.toLowerCase()))
        .limit(1);

      if (!admin) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      }

      const valid = await bcrypt.compare(input.password, admin.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      }

      const token = await signAdminToken(admin.email, admin.name);

      const isProduction = ENV.isProduction;
      ctx.res.cookie(ADMIN_COOKIE, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: COOKIE_MAX_AGE * 1000,
        path: "/",
      });

      return { success: true, name: admin.name, email: admin.email };
    }),

  /** Logout — clears the admin session cookie */
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(ADMIN_COOKIE, { path: "/" });
    return { success: true };
  }),
});
