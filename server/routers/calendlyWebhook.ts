/**
 * calendlyWebhook.ts — Express route handler for Calendly webhook events
 *
 * Registers: POST /api/webhooks/calendly
 *
 * Handles:
 *  - invitee.created  → insert or update scheduledTours row
 *                       auto-create contact if no email match found
 *                       update contact pipelineStage → TOUR_SCHEDULED
 *                       log activity on the contact
 *  - invitee.canceled → mark tour as CANCELLED, log activity
 *
 * NOTE: Calendly already sends its own confirmation email to the invitee.
 * This handler intentionally does NOT send a second confirmation email to
 * avoid the duplicate "rogue" email problem. The scheduling.create mutation
 * (manual bookings only) still sends its own email with .ics attachment.
 */

import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import { scheduledTours, activityLog, contacts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Calendly payload types (simplified) ─────────────────────────────────────

interface CalendlyInviteePayload {
  event: "invitee.created" | "invitee.canceled";
  payload: {
    event: string;           // event URI
    invitee: {
      uri: string;
      name: string;
      email: string;
      cancel_url?: string;
      reschedule_url?: string;
      canceled?: boolean;
      cancellation?: {
        reason?: string;
        canceled_by?: string;
      };
    };
    event_type?: {
      name?: string;
    };
    scheduled_event?: {
      start_time: string;
      end_time: string;
      name?: string;
      location?: {
        type?: string;
        location?: string;
        join_url?: string;
      };
    };
    questions_and_answers?: Array<{
      question: string;
      answer: string;
    }>;
  };
}

// ─── Helper: split "First Last" into parts ───────────────────────────────────

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export function registerCalendlyWebhook(app: Express) {
  app.post("/api/webhooks/calendly", async (req: Request, res: Response) => {
    try {
      const body = req.body as CalendlyInviteePayload;
      const { event, payload } = body;

      if (!event || !payload) {
        res.status(400).json({ error: "Invalid payload" });
        return;
      }

      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Database unavailable" });
        return;
      }

      const inviteeUri = payload.invitee?.uri;
      const eventUri = payload.event;

      if (!inviteeUri || !eventUri) {
        res.status(400).json({ error: "Missing event or invitee URI" });
        return;
      }

      // ── invitee.created ────────────────────────────────────────────────────
      if (event === "invitee.created") {
        const scheduled = payload.scheduled_event;
        const startTime = scheduled?.start_time ? new Date(scheduled.start_time) : new Date();
        const endTime = scheduled?.end_time
          ? new Date(scheduled.end_time)
          : new Date(startTime.getTime() + 60 * 60 * 1000);

        // Determine location string
        let locationStr: string | undefined;
        if (scheduled?.location) {
          locationStr =
            scheduled.location.join_url ??
            scheduled.location.location ??
            scheduled.location.type;
        }

        // Extract phone from questions_and_answers if present
        const phoneAnswer = payload.questions_and_answers?.find(
          (q) =>
            q.question.toLowerCase().includes("phone") ||
            q.question.toLowerCase().includes("number")
        );
        const inviteePhone = phoneAnswer?.answer;

        // ── 1. Try to match existing contact by email ──────────────────────
        let [matchedContact] = await db
          .select({ id: contacts.id, pipelineStage: contacts.pipelineStage })
          .from(contacts)
          .where(eq(contacts.email, payload.invitee.email))
          .limit(1);

        // ── 2. If no match, auto-create a contact from Calendly data ───────
        if (!matchedContact) {
          const { firstName, lastName } = splitName(payload.invitee.name);
          const [insertResult] = await db.insert(contacts).values({
            firstName,
            lastName,
            email: payload.invitee.email,
            phone: inviteePhone ?? "",
            source: "OTHER",
            pipelineStage: "TOUR_SCHEDULED",
            notes: `Auto-created from Calendly booking on ${startTime.toLocaleDateString()}`,
          });
          const newId = (insertResult as { insertId: number }).insertId;

          // Log the form submission activity
          await db.insert(activityLog).values({
            contactId: newId,
            activityType: "FORM_SUBMITTED",
            description: `Lead auto-created from Calendly booking: ${payload.invitee.name} <${payload.invitee.email}>`,
          });

          matchedContact = { id: newId, pipelineStage: "TOUR_SCHEDULED" };
          console.log(
            `[Calendly] Auto-created contact #${newId} for ${payload.invitee.email}`
          );
        } else {
          // ── 3. Update existing contact's pipeline stage to TOUR_SCHEDULED ─
          // Only advance (don't regress) — if already TOURED or beyond, leave it
          const stageOrder = [
            "NEW_INQUIRY",
            "QUALIFIED",
            "TOUR_SCHEDULED",
            "TOURED",
            "OFFER_SUBMITTED",
            "UNDER_CONTRACT",
            "CLOSED",
            "LOST",
          ];
          const currentIdx = stageOrder.indexOf(matchedContact.pipelineStage ?? "NEW_INQUIRY");
          const tourIdx = stageOrder.indexOf("TOUR_SCHEDULED");
          if (currentIdx < tourIdx) {
            await db
              .update(contacts)
              .set({ pipelineStage: "TOUR_SCHEDULED" })
              .where(eq(contacts.id, matchedContact.id));
          }
        }

        // ── 4. Upsert scheduledTours row ───────────────────────────────────
        const existing = await db
          .select({ id: scheduledTours.id })
          .from(scheduledTours)
          .where(eq(scheduledTours.calendlyInviteeUri, inviteeUri))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(scheduledTours)
            .set({
              status: "ACTIVE",
              startTime,
              endTime,
              location: locationStr,
              contactId: matchedContact.id,
              rawPayload: JSON.stringify(body),
            })
            .where(eq(scheduledTours.calendlyInviteeUri, inviteeUri));
        } else {
          await db.insert(scheduledTours).values({
            calendlyEventUri: eventUri,
            calendlyInviteeUri: inviteeUri,
            inviteeName: payload.invitee.name,
            inviteeEmail: payload.invitee.email,
            inviteePhone,
            eventName: scheduled?.name ?? payload.event_type?.name ?? "Home Tour",
            startTime,
            endTime,
            location: locationStr,
            status: "ACTIVE",
            contactId: matchedContact.id,
            rawPayload: JSON.stringify(body),
          });
        }

        // ── 5. Log TOUR_SCHEDULED activity on the contact ──────────────────
        await db.insert(activityLog).values({
          contactId: matchedContact.id,
          activityType: "TOUR_SCHEDULED",
          description: `Tour scheduled via Calendly for ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()}`,
          metadata: JSON.stringify({
            source: "calendly",
            eventUri,
            inviteeUri,
            location: locationStr,
          }),
        });

        // ── NOTE: No confirmation email sent here ──────────────────────────
        // Calendly already sends its own confirmation + calendar invite to the
        // invitee. Sending another one from SCOPS would create a duplicate.
        // Manual tours (scheduling.create) still send their own email.

        console.log(
          `[Calendly] invitee.created: ${payload.invitee.name} <${payload.invitee.email}> → contact #${matchedContact.id} at ${startTime.toISOString()}`
        );
      }

      // ── invitee.canceled ───────────────────────────────────────────────────
      if (event === "invitee.canceled") {
        const cancelReason =
          payload.invitee.cancellation?.reason ?? "Cancelled via Calendly";

        // Find the tour first (to get contactId)
        const [tour] = await db
          .select({ id: scheduledTours.id, contactId: scheduledTours.contactId })
          .from(scheduledTours)
          .where(eq(scheduledTours.calendlyInviteeUri, inviteeUri))
          .limit(1);

        await db
          .update(scheduledTours)
          .set({ status: "CANCELLED", cancelReason, rawPayload: JSON.stringify(body) })
          .where(eq(scheduledTours.calendlyInviteeUri, inviteeUri));

        if (tour?.contactId) {
          await db.insert(activityLog).values({
            contactId: tour.contactId,
            activityType: "STAGE_CHANGE",
            description: `Tour cancelled via Calendly: ${cancelReason}`,
          });
        }

        console.log(
          `[Calendly] invitee.canceled: ${payload.invitee.email} — ${cancelReason}`
        );
      }

      res.status(200).json({ received: true });
    } catch (err) {
      console.error("[Calendly webhook] Error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
