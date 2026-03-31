import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { z } from "zod";
import { getDb } from "../db";
import { adminCredentials, passwordResetTokens } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  /** Request a password reset — sends a reset link to the admin's email */
  requestReset: publicProcedure
    .input(z.object({ email: z.string().email(), origin: z.string().url() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      // Always return success to avoid email enumeration
      const [admin] = await db
        .select()
        .from(adminCredentials)
        .where(eq(adminCredentials.email, input.email.toLowerCase()))
        .limit(1);

      if (!admin) return { success: true };

      // Generate a secure random token
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.insert(passwordResetTokens).values({
        email: admin.email,
        token,
        expiresAt,
      });

      const resetUrl = `${input.origin}/reset-password?token=${token}`;

      await resend.emails.send({
        from: "Apollo Home Builders <hello@apollohomebuilders.com>",
        to: admin.email,
        subject: "Reset your Apollo CRM password",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-logo-horizontal_578ef147.png"
              alt="Homes by Apollo" style="height:48px;margin-bottom:24px;" />
            <h2 style="color:#0f2044;margin:0 0 12px;">Password Reset Request</h2>
            <p style="color:#374151;margin:0 0 24px;line-height:1.6;">Hi ${admin.name},<br/><br/>We received a request to reset your Apollo CRM password. Click the button below to set a new password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display:inline-block;background:#0f2044;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Reset Password</a>
            <p style="color:#9ca3af;font-size:13px;margin-top:24px;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
            <p style="color:#9ca3af;font-size:12px;">Apollo Home Builders &mdash; Pahrump, NV</p>
          </div>
        `,
      });

      return { success: true };
    }),

  /** Validate a reset token and set a new password */
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string().min(1),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const now = new Date();
      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, input.token),
            gt(passwordResetTokens.expiresAt, now),
            isNull(passwordResetTokens.usedAt)
          )
        )
        .limit(1);

      if (!resetToken) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link is invalid or has expired." });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 10);

      // Update the admin's password
      await db
        .update(adminCredentials)
        .set({ passwordHash })
        .where(eq(adminCredentials.email, resetToken.email));

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({ usedAt: now })
        .where(eq(passwordResetTokens.id, resetToken.id));

      return { success: true };
    }),
});
