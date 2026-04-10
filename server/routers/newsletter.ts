import { z } from "zod";
import { getDb } from "../db";
import { newsletterSubscribers } from "../../drizzle/schema";
import { publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { eq } from "drizzle-orm";
import { addListMember } from "../emailDb";

// Lead Magnet List IDs
const BUYERS_GUIDE_LIST_ID = 1;
const PAHRUMP_VS_LV_LIST_ID = 3;

const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_AUDIENCES_URL = "https://api.resend.com/audiences";

// Buyers Guide audience list ID (created 2026-04-06)
const BUYERS_GUIDE_AUDIENCE_ID = "8281a905-19a8-4e2c-9711-ef6b67318d1f";

/**
 * Adds the subscriber to the Resend "Buyers Guide" audience list.
 * This enables Resend broadcast emails to the list.
 */
async function addToResendAudience(email: string): Promise<void> {
  if (!ENV.resendApiKey) return;

  const res = await fetch(
    `${RESEND_AUDIENCES_URL}/${BUYERS_GUIDE_AUDIENCE_ID}/contacts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        unsubscribed: false,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error("[Newsletter] Resend audience add error:", res.status, body);
  } else {
    console.log(`[Newsletter] Added ${email} to Buyers Guide audience`);
  }
}

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
            <tr><td style="background:#0f2044;padding:36px 48px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.2em;color:rgba(255,255,255,0.45);text-transform:uppercase;">Homes by Apollo</p>
              <p style="margin:0;font-size:28px;font-weight:900;letter-spacing:0.04em;color:white;">APOLLO</p>
            </td></tr>
            <!-- Body -->
            <tr><td style="padding:48px 48px 36px;">
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#0f2044;letter-spacing:-0.02em;line-height:1.2;">Your 2026 Buyer's Guide is on its way.</h1>
              <p style="margin:0 0 20px;font-size:16px;color:#444;line-height:1.7;">
                Thank you for downloading the 2026 Pahrump Home Buyer's Guide. You'll also be the first to know when new homes and lots become available in Pahrump, before they hit the open market.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#666;line-height:1.7;">
                No spam. Just the listings that matter. You can unsubscribe at any time.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:12px;"><tr>
                <td style="background:#c9a84c;border-radius:8px;">
                  <a href="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/2026-Pahrump-Home-Buyers-Guide_ad685e4b.pdf" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#0f2044;text-decoration:none;letter-spacing:0.02em;">&#8595; Download Your Free Guide (PDF)</a>
                </td>
              </tr></table>
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="background:#0f2044;border-radius:8px;">
                  <a href="https://apollohomebuilders.com" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:white;text-decoration:none;letter-spacing:0.02em;">View Current Homes &rarr;</a>
                </td>
              </tr></table>
            </td></tr>
            <!-- Footer -->
            <tr><td style="border-top:1px solid #eee;padding:24px 48px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;">
                Apollo Home Builders &middot; Pahrump, Nevada<br>
                You're receiving this because you requested the 2026 Buyer's Guide at apollohomebuilders.com
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
      subject: "Your 2026 Pahrump Home Buyer's Guide — Homes by Apollo",
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
    .input(z.object({ email: z.string().email(), source: z.string().optional() }))
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
        // Already in DB — still ensure they're in the Resend audience (idempotent)
        addToResendAudience(input.email).catch(console.error);
        return { success: true, alreadySubscribed: true };
      }

      // Insert new subscriber
      await db.insert(newsletterSubscribers).values({
        email: input.email.toLowerCase(),
        source: input.source ?? "buyers-guide",
        subscribedAt: new Date(),
      });

      // Add to Resend Buyers Guide audience (non-blocking)
      addToResendAudience(input.email).catch(err =>
        console.error("[Newsletter] Audience add failed:", err)
      );

      // Add to Buyer's Guide email list (non-blocking)
      const listId = input.source === "pahrump-vs-las-vegas"
        ? PAHRUMP_VS_LV_LIST_ID
        : BUYERS_GUIDE_LIST_ID;
      addListMember({
        listId,
        email: input.email,
        source: input.source ?? "buyers-guide",
      }).catch(err => console.error("[Newsletter] List member add failed:", err));

      // Send confirmation email (non-blocking)
      sendNewsletterConfirmation(input.email).catch(err =>
        console.error("[Newsletter] Confirmation email failed:", err)
      );

      return { success: true, alreadySubscribed: false };
    }),
});
