/**
 * unsubscribeEndpoint.ts — Express route handler for one-click email unsubscribes
 *
 * Registers:
 *   GET  /api/unsubscribe?token=<base64url>  — browser-friendly unsubscribe page
 *   POST /api/unsubscribe                    — RFC 8058 List-Unsubscribe-Post one-click
 *
 * Token format: base64url(JSON.stringify({ email, campaignId }))
 */

import type { Express, Request, Response } from "express";
import { isUnsubscribed, recordUnsubscribe } from "../emailDb";

function parseToken(token: string): { email: string; campaignId?: number } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString());
    if (!decoded.email) return null;
    return decoded;
  } catch {
    return null;
  }
}

function unsubscribeSuccessHtml(email: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unsubscribed — Apollo Home Builders</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; background: #f8f6f2; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; border-radius: 12px; padding: 48px 40px; max-width: 480px; width: 90%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .logo { color: #1a3a5c; font-size: 18px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px; }
    h1 { color: #1a3a5c; font-size: 24px; margin-bottom: 16px; }
    p { color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 12px; }
    a { color: #1a3a5c; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Apollo Home Builders</div>
    <h1>You've been unsubscribed</h1>
    <p><strong>${email}</strong> has been removed from our mailing list.</p>
    <p>You won't receive any further marketing emails from us.</p>
    <p style="margin-top: 24px;"><a href="https://apollohomebuilders.com">Return to our website</a></p>
  </div>
</body>
</html>`;
}

function alreadyUnsubscribedHtml(email: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Already Unsubscribed — Apollo Home Builders</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; background: #f8f6f2; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; border-radius: 12px; padding: 48px 40px; max-width: 480px; width: 90%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .logo { color: #1a3a5c; font-size: 18px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px; }
    h1 { color: #1a3a5c; font-size: 24px; margin-bottom: 16px; }
    p { color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 12px; }
    a { color: #1a3a5c; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Apollo Home Builders</div>
    <h1>Already unsubscribed</h1>
    <p><strong>${email}</strong> is already unsubscribed from our mailing list.</p>
    <p style="margin-top: 24px;"><a href="https://apollohomebuilders.com">Return to our website</a></p>
  </div>
</body>
</html>`;
}

export function registerUnsubscribeEndpoint(app: Express): void {
  // GET /api/unsubscribe?token=... — browser click from email
  app.get("/api/unsubscribe", async (req: Request, res: Response) => {
    const token = req.query.token as string | undefined;
    if (!token) {
      return res.status(400).send("Invalid unsubscribe link.");
    }

    const parsed = parseToken(token);
    if (!parsed) {
      return res.status(400).send("Invalid unsubscribe token.");
    }

    const { email, campaignId } = parsed;

    const alreadyUnsub = await isUnsubscribed(email);
    if (alreadyUnsub) {
      return res.status(200).send(alreadyUnsubscribedHtml(email));
    }

    await recordUnsubscribe({ email, campaignId, reason: "link_click" });
    return res.status(200).send(unsubscribeSuccessHtml(email));
  });

  // POST /api/unsubscribe — RFC 8058 one-click (List-Unsubscribe-Post header)
  app.post("/api/unsubscribe", async (req: Request, res: Response) => {
    const token = (req.body?.token || req.query.token) as string | undefined;
    if (!token) {
      return res.status(400).json({ error: "Missing token" });
    }

    const parsed = parseToken(token);
    if (!parsed) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const { email, campaignId } = parsed;
    const alreadyUnsub = await isUnsubscribed(email);
    if (!alreadyUnsub) {
      await recordUnsubscribe({ email, campaignId, reason: "one_click" });
    }

    return res.status(200).json({ success: true });
  });
}
