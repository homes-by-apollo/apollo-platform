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

startServer().catch(console.error);
