/**
 * CRM Extras Router
 * Handles follow-ups, appointments, and lead attachments (S3).
 * Wired into appRouter as `trpc.crm.*`
 */

import { TRPCError } from "@trpc/server";
import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { storagePut } from "../storage";
import {
  appointments,
  followUps,
  leadAttachments,
  contacts,
  contracts,
} from "../../drizzle/schema";
import { logActivity } from "../db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const crmExtrasRouter = router({

  // ── Follow-Ups ──────────────────────────────────────────────────────────────

  /** List all follow-ups for a contact */
  listFollowUps: protectedProcedure
    .input(z.object({ contactId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db
        .select()
        .from(followUps)
        .where(eq(followUps.contactId, input.contactId))
        .orderBy(desc(followUps.dueAt));
    }),

  /** Create a follow-up task */
  createFollowUp: protectedProcedure
    .input(
      z.object({
        contactId: z.number(),
        type: z.enum(["CALL", "EMAIL", "TEXT", "MEETING", "OTHER"]),
        note: z.string().optional(),
        dueAt: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [result] = await db.insert(followUps).values({
        contactId: input.contactId,
        type: input.type,
        note: input.note ?? null,
        dueAt: input.dueAt,
        createdBy: ctx.user?.id ?? null,
      });
      await logActivity({
        contactId: input.contactId,
        userId: ctx.user?.id,
        activityType: "NOTE_ADDED",
        description: `Follow-up scheduled: ${input.type}${input.note ? ` — "${input.note}"` : ""} (due ${input.dueAt.toLocaleDateString()})`,
      });
      return { id: (result as any).insertId };
    }),

  /** Mark a follow-up as complete */
  completeFollowUp: protectedProcedure
    .input(z.object({ id: z.number(), contactId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(followUps)
        .set({ completedAt: new Date(), completedBy: ctx.user?.id ?? null })
        .where(and(eq(followUps.id, input.id), eq(followUps.contactId, input.contactId)));
      return { success: true };
    }),

  /** Delete a follow-up */
  deleteFollowUp: protectedProcedure
    .input(z.object({ id: z.number(), contactId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .delete(followUps)
        .where(and(eq(followUps.id, input.id), eq(followUps.contactId, input.contactId)));
      return { success: true };
    }),

  // ── Appointments ────────────────────────────────────────────────────────────

  /** List all appointments for a contact */
  listAppointments: protectedProcedure
    .input(z.object({ contactId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db
        .select()
        .from(appointments)
        .where(eq(appointments.contactId, input.contactId))
        .orderBy(desc(appointments.scheduledAt));
    }),

  /** Create an appointment */
  createAppointment: protectedProcedure
    .input(
      z.object({
        contactId: z.number(),
        title: z.string().min(1).max(256),
        type: z.enum(["TOUR", "CALL", "MEETING", "SHOWING", "OTHER"]),
        scheduledAt: z.date(),
        durationMinutes: z.number().int().min(5).max(480).optional().default(60),
        location: z.string().max(256).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [result] = await db.insert(appointments).values({
        contactId: input.contactId,
        title: input.title,
        type: input.type,
        scheduledAt: input.scheduledAt,
        durationMinutes: input.durationMinutes,
        location: input.location ?? null,
        notes: input.notes ?? null,
        status: "SCHEDULED",
        createdBy: ctx.user?.id ?? null,
      });
      await logActivity({
        contactId: input.contactId,
        userId: ctx.user?.id,
        activityType: "TOUR_SCHEDULED",
        description: `Appointment booked: "${input.title}" on ${input.scheduledAt.toLocaleDateString()}`,
      });
      return { id: (result as any).insertId };
    }),

  /** Update appointment status */
  updateAppointmentStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        contactId: z.number(),
        status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(appointments)
        .set({ status: input.status })
        .where(and(eq(appointments.id, input.id), eq(appointments.contactId, input.contactId)));
      return { success: true };
    }),

  /** Delete an appointment */
  deleteAppointment: protectedProcedure
    .input(z.object({ id: z.number(), contactId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .delete(appointments)
        .where(and(eq(appointments.id, input.id), eq(appointments.contactId, input.contactId)));
      return { success: true };
    }),

  // ── Attachments ─────────────────────────────────────────────────────────────

  /** List all attachments for a contact */
  listAttachments: protectedProcedure
    .input(z.object({ contactId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db
        .select()
        .from(leadAttachments)
        .where(eq(leadAttachments.contactId, input.contactId))
        .orderBy(desc(leadAttachments.createdAt));
    }),

  /**
   * Upload a file attachment for a contact.
   * Accepts base64-encoded file content from the frontend.
   */
  uploadAttachment: protectedProcedure
    .input(
      z.object({
        contactId: z.number(),
        filename: z.string().min(1).max(256),
        mimeType: z.string().max(128),
        sizeBytes: z.number().int(),
        base64: z.string(), // base64-encoded file content
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Decode base64 → Buffer
      const buffer = Buffer.from(input.base64, "base64");

      // Build S3 key with random suffix to prevent enumeration
      const ext = input.filename.split(".").pop() ?? "bin";
      const fileKey = `lead-attachments/${input.contactId}/${Date.now()}-${randomSuffix()}.${ext}`;

      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      const [result] = await db.insert(leadAttachments).values({
        contactId: input.contactId,
        filename: input.filename,
        fileKey,
        fileUrl: url,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        uploadedBy: ctx.user?.id ?? null,
      });

      await logActivity({
        contactId: input.contactId,
        userId: ctx.user?.id,
        activityType: "NOTE_ADDED",
        description: `File attached: "${input.filename}" (${(input.sizeBytes / 1024).toFixed(1)} KB)`,
      });

      return { id: (result as any).insertId, url };
    }),

  /** Delete an attachment */
  deleteAttachment: protectedProcedure
    .input(z.object({ id: z.number(), contactId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .delete(leadAttachments)
        .where(and(eq(leadAttachments.id, input.id), eq(leadAttachments.contactId, input.contactId)));
      return { success: true };
    }),

  // ── Contracts ─────────────────────────────────────────────────────────────

  /** List all contracts for a contact */
  listContracts: protectedProcedure
    .input(z.object({ contactId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(contracts)
        .where(eq(contracts.contactId, input.contactId))
        .orderBy(desc(contracts.createdAt));
    }),

  /** Create a new contract */
  createContract: protectedProcedure
    .input(z.object({
      contactId: z.number(),
      title: z.string().default("Purchase Agreement"),
      purchasePrice: z.number().optional(),
      lotAddress: z.string().optional(),
      contractDate: z.string().optional(),
      status: z.enum(["PENDING", "EXECUTED", "CANCELLED"]).default("PENDING"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [result] = await db.insert(contracts).values({
        contactId: input.contactId,
        title: input.title,
        purchasePrice: input.purchasePrice,
        lotAddress: input.lotAddress,
        contractDate: input.contractDate ? new Date(input.contractDate) : undefined,
        status: input.status,
        notes: input.notes,
        createdBy: ctx.user?.id ?? null,
      });
      await logActivity({
        contactId: input.contactId,
        userId: ctx.user?.id,
        activityType: "NOTE_ADDED",
        description: `Contract "${input.title}" created with status ${input.status}`,
      });
      return { id: (result as any).insertId };
    }),

  /** Update a contract */
  updateContract: protectedProcedure
    .input(z.object({
      id: z.number(),
      contactId: z.number(),
      title: z.string().optional(),
      purchasePrice: z.number().optional(),
      lotAddress: z.string().optional(),
      contractDate: z.string().optional(),
      status: z.enum(["PENDING", "EXECUTED", "CANCELLED"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, contactId, contractDate, ...rest } = input;
      await db.update(contracts).set({
        ...rest,
        ...(contractDate ? { contractDate: new Date(contractDate) } : {}),
      }).where(and(eq(contracts.id, id), eq(contracts.contactId, contactId)));
      return { success: true };
    }),

  /** Delete a contract */
  deleteContract: protectedProcedure
    .input(z.object({ id: z.number(), contactId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(contracts).where(and(eq(contracts.id, input.id), eq(contracts.contactId, input.contactId)));
      return { success: true };
    }),

  // ── Delete Lead ─────────────────────────────────────────────────────────────

  /** Permanently delete a contact and all related records */
  deleteLead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Delete related records first (no FK cascade in MySQL)
      await db.delete(followUps).where(eq(followUps.contactId, input.id));
      await db.delete(appointments).where(eq(appointments.contactId, input.id));
      await db.delete(leadAttachments).where(eq(leadAttachments.contactId, input.id));
      await db.delete(contracts).where(eq(contracts.contactId, input.id));

      // Delete the contact itself
      await db.delete(contacts).where(eq(contacts.id, input.id));

      return { success: true };
    }),
});
