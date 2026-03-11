import { z } from "zod";
import { getDb } from "../db";
import { newsletterSubscribers } from "../../drizzle/schema";
import { publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { eq } from "drizzle-orm";

const RESEND_API_URL = "https://api.resend.com/emails";

async function sendNewsletterConfirmation(email: string): Promise<void> {
  if (!ENV.resendApiKey) {
    console.warn("[Newsletter] RESEND_API_KEY not set — skipping confirmation email");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f5f4f0;font-family:'Georgia',serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:48px 0;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <!-- Header -->
            <tr><td style="background:#1a2e1a;padding:36px 48px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.2em;color:rgba(255,255,255,0.45);text-transform:uppercase;">Homes by Apollo</p>
              <p style="margin:0;font-size:28px;font-weight:900;letter-spacing:0.04em;color:white;">APOLLO</p>
            </td></tr>
            <!-- Body -->
            <tr><td style="padding:48px 48px 36px;">
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#1a2e1a;letter-spacing:-0.02em;line-height:1.2;">You're on the list.</h1>
              <p style="margin:0 0 20px;font-size:16px;color:#444;line-height:1.7;">
                Thanks for signing up. You'll be the first to know when new lots and homes are available in Pahrump — before they hit Zillow.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#666;line-height:1.7;">
                In the meantime, feel free to browse our current listings or schedule a free consultation with our team.
              </p>
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="background:#1a2e1a;border-radius:8px;">
                  <a href="https://apollohomebuilders.com" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:white;text-decoration:none;letter-spacing:0.02em;">View Current Homes →</a>
                </td>
              </tr></table>
            </td></tr>
            <!-- Footer -->
            <tr><td style="border-top:1px solid #eee;padding:24px 48px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;">
                Apollo Home Builders · Pahrump, Nevada<br>
                You're receiving this because you subscribed at apollohomebuilders.com
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "hello@apollohomebuilders.com",
      to: [email],
      subject: "You're on the list — Homes by Apollo",
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[Newsletter] Resend error:", res.status, body);
  }
}

export const newsletterRouter = router({
  subscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check if already subscribed
      const existing = await db
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, input.email.toLowerCase()))
        .limit(1);

      if (existing.length > 0) {
        // Already subscribed — return success silently (no duplicate email)
        return { success: true, alreadySubscribed: true };
      }

      // Insert new subscriber
      await db.insert(newsletterSubscribers).values({
        email: input.email.toLowerCase(),
        source: "footer",
        subscribedAt: new Date(),
      });

      // Send confirmation email (non-blocking — don't fail the mutation if Resend is down)
      sendNewsletterConfirmation(input.email).catch(err =>
        console.error("[Newsletter] Confirmation email failed:", err)
      );

      return { success: true, alreadySubscribed: false };
    }),
});
