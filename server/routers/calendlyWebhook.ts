/**
 * calendlyWebhook.ts — Express route handler for Calendly webhook events
 *
 * Registers: POST /api/webhooks/calendly
 *
 * Handles:
 *  - invitee.created  → insert or update scheduledTours row
 *  - invitee.canceled → mark tour as CANCELLED
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

      if (event === "invitee.created") {
        const scheduled = payload.scheduled_event;
        const startTime = scheduled?.start_time ? new Date(scheduled.start_time) : new Date();
        const endTime = scheduled?.end_time ? new Date(scheduled.end_time) : new Date(startTime.getTime() + 60 * 60 * 1000);

        // Determine location string
        let locationStr: string | undefined;
        if (scheduled?.location) {
          locationStr = scheduled.location.join_url ?? scheduled.location.location ?? scheduled.location.type;
        }

        // Extract phone from questions_and_answers if present
        const phoneAnswer = payload.questions_and_answers?.find(
          q => q.question.toLowerCase().includes("phone") || q.question.toLowerCase().includes("number")
        );
        const inviteePhone = phoneAnswer?.answer;

        // Try to match to an existing contact by email
        const [matchedContact] = await db
          .select({ id: contacts.id })
          .from(contacts)
          .where(eq(contacts.email, payload.invitee.email))
          .limit(1);

        // Upsert: if a row with this inviteeUri already exists, update it
        const existing = await db
          .select({ id: scheduledTours.id })
          .from(scheduledTours)
          .where(eq(scheduledTours.calendlyInviteeUri, inviteeUri))
          .limit(1);

        if (existing.length > 0) {
          await db.update(scheduledTours)
            .set({
              status: "ACTIVE",
              startTime,
              endTime,
              location: locationStr,
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
            contactId: matchedContact?.id ?? undefined,
            rawPayload: JSON.stringify(body),
          });

          // Log activity if matched to a contact
          if (matchedContact?.id) {
            await db.insert(activityLog).values({
              contactId: matchedContact.id,
              activityType: "TOUR_SCHEDULED",
              description: `Tour scheduled via Calendly for ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()}`,
            });
          }
        }

        console.log(`[Calendly] invitee.created: ${payload.invitee.name} <${payload.invitee.email}> at ${startTime.toISOString()}`);
      }

      if (event === "invitee.canceled") {
        const cancelReason = payload.invitee.cancellation?.reason ?? "Cancelled via Calendly";

        await db.update(scheduledTours)
          .set({ status: "CANCELLED", cancelReason, rawPayload: JSON.stringify(body) })
          .where(eq(scheduledTours.calendlyInviteeUri, inviteeUri));

        // Find the tour to log activity
        const [tour] = await db
          .select({ id: scheduledTours.id, contactId: scheduledTours.contactId })
          .from(scheduledTours)
          .where(eq(scheduledTours.calendlyInviteeUri, inviteeUri))
          .limit(1);

        if (tour?.contactId) {
          await db.insert(activityLog).values({
            contactId: tour.contactId,
            activityType: "STAGE_CHANGE",
            description: `Tour cancelled via Calendly: ${cancelReason}`,
          });
        }

        console.log(`[Calendly] invitee.canceled: ${payload.invitee.email} — ${cancelReason}`);
      }

      res.status(200).json({ received: true });
    } catch (err) {
      console.error("[Calendly webhook] Error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
