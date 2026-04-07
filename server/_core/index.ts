import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerCalendlyWebhook } from "../routers/calendlyWebhook";
import { sendWeeklyTourDigest } from "../weeklyTourDigest";
import { getDb } from "../db";
import { blogPosts, contacts, adminCredentials } from "../../drizzle/schema";
import { and, eq, lte, isNotNull, inArray } from "drizzle-orm";
import { Resend } from "resend";
import { getStaleThresholdHours, getStaleAlertEnabled } from "../routers/settings";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Parse cookies so req.cookies is populated for all routes (required for admin auth)
  app.use(cookieParser());
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Calendly webhook under /api/webhooks/calendly
  registerCalendlyWebhook(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // ─── Weekly Tour Digest Cron (every Sunday at 6:00 PM PT = 01:00 UTC Monday) ─
  scheduleSundayDigest();

  // ─── Scheduled Blog Post Auto-Publish (every 5 minutes) ──────────────────────
  scheduleAutoPublish();

  // ─── Lead Re-engagement: Flag Stale Leads (every 15 minutes) ─────────────────
  scheduleLeadReengagement();
}

function scheduleSundayDigest() {
  function msUntilNextSunday6pmPT(): number {
    const now = new Date();
    // Get current time in PT (UTC-7 PDT / UTC-8 PST)
    // Use a fixed offset approach: find next Sunday 6 PM PT
    const ptOffset = -7 * 60; // PDT offset in minutes (adjust to -8 for PST if needed)
    const nowPT = new Date(now.getTime() + ptOffset * 60 * 1000);
    const dayOfWeek = nowPT.getUTCDay(); // 0=Sun
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
    const nextSunday = new Date(nowPT);
    nextSunday.setUTCDate(nowPT.getUTCDate() + daysUntilSunday);
    nextSunday.setUTCHours(18, 0, 0, 0); // 6 PM PT
    // Convert back to UTC
    const nextSundayUTC = new Date(nextSunday.getTime() - ptOffset * 60 * 1000);
    return nextSundayUTC.getTime() - now.getTime();
  }

  function scheduleNext() {
    const delay = msUntilNextSunday6pmPT();
    const nextRun = new Date(Date.now() + delay);
    console.log(`[WeeklyDigest] Next digest scheduled for ${nextRun.toISOString()} (in ${Math.round(delay / 3600000)}h)`);
    setTimeout(async () => {
      try {
        const result = await sendWeeklyTourDigest();
        console.log(`[WeeklyDigest] Sent to ${result.sent} recipients: ${result.recipients.join(", ")}`);
      } catch (err) {
        console.error("[WeeklyDigest] Failed to send digest:", err);
      }
      scheduleNext(); // reschedule for next Sunday
    }, delay);
  }

  scheduleNext();
}

/** Every 5 minutes, publish any blog posts whose scheduledPublishAt has passed */
function scheduleAutoPublish() {
  async function runAutoPublish() {
    try {
      const db = await getDb();
      if (!db) return;
      const now = new Date();
      const due = await db
        .select({ id: blogPosts.id, title: blogPosts.title })
        .from(blogPosts)
        .where(
          and(
            eq(blogPosts.status, "draft"),
            isNotNull(blogPosts.scheduledPublishAt),
            lte(blogPosts.scheduledPublishAt, now)
          )
        );

      for (const post of due) {
        await db
          .update(blogPosts)
          .set({ status: "published", publishedAt: now, scheduledPublishAt: null })
          .where(eq(blogPosts.id, post.id));
        console.log(`[AutoPublish] Published blog post #${post.id}: "${post.title}"`);
      }
    } catch (err) {
      console.error("[AutoPublish] Error during scheduled publish check:", err);
    }
  }

  // Run immediately on startup, then every 5 minutes
  runAutoPublish();
  setInterval(runAutoPublish, 5 * 60 * 1000);
  console.log("[AutoPublish] Scheduled blog post auto-publish running every 5 minutes");
}

/** Every 15 minutes, flag leads with overdue nextActionDueAt and alert assigned reps */
function scheduleLeadReengagement() {
  async function runFlagStale() {
    try {
      const db = await getDb();
      if (!db) return;

      const now = new Date();
      const staleHours = await getStaleThresholdHours();
      const cutoff = new Date(now.getTime() - staleHours * 60 * 60 * 1000);
      const activeStages = ["NEW_INQUIRY", "QUALIFIED", "TOUR_SCHEDULED", "TOURED", "OFFER_SUBMITTED", "UNDER_CONTRACT"];

      // Find leads with a past nextActionDueAt in active stages (older than staleHours)
      const overdueLeads = await db
        .select({
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
          nextAction: contacts.nextAction,
          nextActionDueAt: contacts.nextActionDueAt,
          pipelineStage: contacts.pipelineStage,
          assignedTo: contacts.assignedTo,
          repEmail: adminCredentials.email,
          repName: adminCredentials.name,
        })
        .from(contacts)
        .leftJoin(adminCredentials, eq(contacts.assignedTo, adminCredentials.id))
        .where(
          and(
            isNotNull(contacts.nextActionDueAt),
            lte(contacts.nextActionDueAt, now),
            inArray(contacts.pipelineStage, activeStages as ("NEW_INQUIRY" | "QUALIFIED" | "TOUR_SCHEDULED" | "TOURED" | "OFFER_SUBMITTED" | "UNDER_CONTRACT")[])
          )
        );

      if (overdueLeads.length === 0) return;

      // Get fallback admin emails for unassigned leads (only those who opted in)
      const allAdmins = await db
        .select({ email: adminCredentials.email, name: adminCredentials.name, receiveStaleAlerts: adminCredentials.receiveStaleAlerts })
        .from(adminCredentials);

      // Check if email alerts are enabled before sending
      const alertEnabled = await getStaleAlertEnabled();

      const resend = new Resend(process.env.RESEND_API_KEY);
      const stageLabel: Record<string, string> = {
        NEW_INQUIRY: "New Inquiry", QUALIFIED: "Qualified",
        TOUR_SCHEDULED: "Tour Scheduled", TOURED: "Toured",
        OFFER_SUBMITTED: "Offer Submitted", UNDER_CONTRACT: "Under Contract",
      };

      let flagged = 0;
      for (const lead of overdueLeads) {
        // Clear nextActionDueAt so this lead is not re-flagged on the next run
        await db.update(contacts)
          .set({ nextActionDueAt: null })
          .where(eq(contacts.id, lead.id));
        flagged++;

        const leadName = `${lead.firstName} ${lead.lastName}`.trim();
        // Per-rep opt-in: only include reps who have receiveStaleAlerts = true
        const assignedRepRow = lead.repEmail
          ? allAdmins.find(a => a.email === lead.repEmail)
          : null;
        const assignedRepOptedIn = assignedRepRow ? assignedRepRow.receiveStaleAlerts !== false : true;
        const recipients: { email: string; name: string }[] = lead.repEmail
          ? (assignedRepOptedIn ? [{ email: lead.repEmail, name: lead.repName ?? "Rep" }] : [])
          : allAdmins.filter(a => a.receiveStaleAlerts !== false);

        if (!alertEnabled) continue; // alerts disabled via SCOPS Settings

        for (const rep of recipients) {
          const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#fff">
  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px 24px;margin-bottom:24px">
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.06em">Action Overdue</p>
    <p style="margin:0;font-size:22px;font-weight:800;color:#111">${leadName}</p>
    <p style="margin:4px 0 0;font-size:14px;color:#6b7280">${stageLabel[lead.pipelineStage ?? ""] ?? lead.pipelineStage}</p>
  </div>
  <p style="font-size:15px;color:#374151;line-height:1.7">
    Hi ${rep.name}, the action <strong>"${lead.nextAction ?? "Follow up"}"</strong> for <strong>${leadName}</strong>
    was due on <strong>${lead.nextActionDueAt?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) ?? "(date unknown)"}</strong>
    and has not been completed.
  </p>
  <a href="https://apollohomebuilders.com/scops/pipeline" style="display:inline-block;background:#0f2044;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;margin-top:8px">Open Pipeline</a>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0" />
  <p style="color:#9ca3af;font-size:12px">Apollo Home Builders &middot; Pahrump, NV &middot; (775) 363-1616</p>
</div>`;
          try {
            await resend.emails.send({
              from: "Apollo SCOPS <hello@apollohomebuilders.com>",
              to: rep.email,
              subject: `[Action Overdue] ${leadName} \u2014 ${lead.nextAction ?? "Follow up"}`,
              html,
            });
          } catch {
            // Non-fatal
          }
        }
      }

      if (flagged > 0) {
        console.log(`[LeadReengagement] Flagged ${flagged} overdue leads and sent alerts`);
      }
    } catch (err) {
      console.error("[LeadReengagement] Error:", err);
    }
  }

  // Run immediately on startup, then every 15 minutes
  runFlagStale();
  setInterval(runFlagStale, 15 * 60 * 1000);
  console.log("[LeadReengagement] Stale lead detection running every 15 minutes");
}

startServer().catch(console.error);
