/**
 * weeklyTourDigest.ts
 * Sends a weekly tour digest email to all active SCOPS team members.
 * Covers tours scheduled for the next 7 days (Mon–Sun of the coming week).
 */
import { Resend } from "resend";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { scopsTeam, scheduledTours } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

const resend = new Resend(ENV.resendApiKey);

function getNextWeekRange(): { start: Date; end: Date; label: string } {
  const now = new Date();
  // Start from tomorrow
  const start = new Date(now);
  start.setDate(now.getDate() + 1);
  start.setHours(0, 0, 0, 0);
  // End 7 days from now
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const label = `${fmt(start)} – ${fmt(end)}`;
  return { start, end, label };
}

function formatTourTime(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Los_Angeles",
  }) + " PT";
}

function buildEmailHtml(tours: typeof scheduledTours.$inferSelect[], weekLabel: string): string {
  const activeTours = tours.filter((t) => t.status === "ACTIVE");
  const cancelledTours = tours.filter((t) => t.status === "CANCELLED");

  const tourRows =
    activeTours.length === 0
      ? `<tr><td colspan="4" style="padding:20px;text-align:center;color:#6b7280;font-style:italic;">No tours scheduled for this week.</td></tr>`
      : activeTours
          .map(
            (t) => `
          <tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:12px 16px;font-weight:600;color:#0f2044;">${t.inviteeName}</td>
            <td style="padding:12px 16px;color:#374151;">${t.inviteeEmail}</td>
            <td style="padding:12px 16px;color:#374151;">${t.inviteePhone || "—"}</td>
            <td style="padding:12px 16px;color:#374151;">${formatTourTime(t.startTime)}</td>
          </tr>`
          )
          .join("");

  const cancelledSection =
    cancelledTours.length > 0
      ? `
      <h3 style="color:#dc2626;margin:32px 0 12px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
        Cancelled This Week (${cancelledTours.length})
      </h3>
      <ul style="margin:0;padding-left:20px;color:#6b7280;">
        ${cancelledTours.map((t) => `<li>${t.inviteeName} — ${formatTourTime(t.startTime)}</li>`).join("")}
      </ul>`
      : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <tr>
          <td style="background:#0f2044;padding:32px 40px;">
            <div style="color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:8px;">Apollo SCOPS</div>
            <div style="color:white;font-size:24px;font-weight:800;letter-spacing:-0.02em;">Weekly Tour Digest</div>
            <div style="color:rgba(255,255,255,0.6);font-size:14px;margin-top:6px;">${weekLabel}</div>
          </td>
        </tr>

        <!-- Stats bar -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-bottom:1px solid #e5e7eb;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center;">
                  <div style="font-size:32px;font-weight:800;color:#0f2044;">${activeTours.length}</div>
                  <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Tours Scheduled</div>
                </td>
                <td style="text-align:center;">
                  <div style="font-size:32px;font-weight:800;color:#dc2626;">${cancelledTours.length}</div>
                  <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Cancelled</div>
                </td>
                <td style="text-align:center;">
                  <div style="font-size:32px;font-weight:800;color:#059669;">${activeTours.length + cancelledTours.length}</div>
                  <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Total This Week</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Tour table -->
        <tr>
          <td style="padding:32px 40px 0;">
            <h3 style="color:#0f2044;margin:0 0 16px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
              Upcoming Tours (${activeTours.length})
            </h3>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Name</th>
                  <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Email</th>
                  <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Phone</th>
                  <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Date & Time</th>
                </tr>
              </thead>
              <tbody>${tourRows}</tbody>
            </table>
          </td>
        </tr>

        ${cancelledSection ? `<tr><td style="padding:0 40px;">${cancelledSection}</td></tr>` : ""}

        <!-- CTA -->
        <tr>
          <td style="padding:32px 40px;">
            <a href="https://apollohomebuilders.com/scops/scheduling" 
               style="display:inline-block;background:#0f2044;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;">
              Open SCOPS Scheduling →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              This digest is sent every Sunday evening to the Apollo SCOPS team. 
              To manage team members, visit <a href="https://apollohomebuilders.com/scops" style="color:#0f2044;">SCOPS</a>.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendWeeklyTourDigest(): Promise<{ sent: number; recipients: string[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { start, end, label } = getNextWeekRange();

  // Get all active SCOPS team members
  const team = await db
    .select()
    .from(scopsTeam)
    .where(eq(scopsTeam.active, 1));

  if (team.length === 0) {
    console.log("[WeeklyDigest] No active team members found.");
    return { sent: 0, recipients: [] };
  }

  // Get tours for the next 7 days
  const tours = await db
    .select()
    .from(scheduledTours)
    .where(and(gte(scheduledTours.startTime, start), lte(scheduledTours.startTime, end)));

  const html = buildEmailHtml(tours, label);
  const subject = `🦉 SCOPS Weekly Tour Digest — ${label} (${tours.filter((t: typeof scheduledTours.$inferSelect) => t.status === "ACTIVE").length} tours)`;

  const recipients: string[] = [];

  for (const member of team) {
    try {
      await resend.emails.send({
        from: "Apollo SCOPS <hello@apollohomebuilders.com>",
        to: member.email,
        subject,
        html,
      });
      recipients.push(member.email);
      console.log(`[WeeklyDigest] Sent to ${member.name} <${member.email}>`);
    } catch (err) {
      console.error(`[WeeklyDigest] Failed to send to ${member.email}:`, err);
    }
  }

  return { sent: recipients.length, recipients };
}
