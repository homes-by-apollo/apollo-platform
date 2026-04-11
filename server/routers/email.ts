/**
 * Email Marketing Router
 * Handles lists, members, campaigns, sending, unsubscribes, and analytics.
 */

import { TRPCError } from "@trpc/server";
import { Resend } from "resend";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { emailSequences } from "../../drizzle/schema";
import {
  addContactToDefaultLists,
  addListMember,
  bulkCreateEmailSends,
  createCampaign,
  createEmailList,
  deleteCampaign,
  deleteEmailList,
  getCampaignById,
  getCampaignStats,
  getCampaigns,
  getEmailListById,
  getEmailLists,
  getListMembers,
  getOverallEmailStats,
  getUnsubscribes,
  isUnsubscribed,
  recordUnsubscribe,
  removeListMember,
  updateCampaign,
  updateEmailList,
} from "../emailDb";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "RESEND_API_KEY not configured" });
  return new Resend(key);
}

function buildUnsubscribeUrl(email: string, campaignId: number, origin: string): string {
  const token = Buffer.from(JSON.stringify({ email, campaignId })).toString("base64url");
  return `${origin}/api/unsubscribe?token=${token}`;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const emailRouter = router({
  // ── Lists ──────────────────────────────────────────────────────────────────

  getLists: protectedProcedure.query(async () => {
    return getEmailLists();
  }),

  createList: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128),
        description: z.string().max(512).optional(),
        isDefault: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ input }) => {
      return createEmailList({
        name: input.name,
        description: input.description,
        isDefault: input.isDefault ? 1 : 0,
      });
    }),

  updateList: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(128).optional(),
        description: z.string().max(512).optional(),
        isDefault: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, isDefault, ...rest } = input;
      await updateEmailList(id, {
        ...rest,
        ...(isDefault !== undefined ? { isDefault: isDefault ? 1 : 0 } : {}),
      });
      return { success: true };
    }),

  deleteList: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteEmailList(input.id);
      return { success: true };
    }),

  // ── Members ────────────────────────────────────────────────────────────────

  getMembers: protectedProcedure
    .input(z.object({ listId: z.number() }))
    .query(async ({ input }) => {
      return getListMembers(input.listId);
    }),

  // Export all members of a list as a CSV string
  exportMembersCsv: protectedProcedure
    .input(z.object({ listId: z.number() }))
    .query(async ({ input }) => {
      const members = await getListMembers(input.listId);
      const header = "Email,Name,Source,Subscribed At,Unsubscribed At";
      const rows = (members as any[]).map((m) => {
        const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
        const subscribedAt   = m.subscribedAt   ? new Date(m.subscribedAt).toISOString()   : "";
        const unsubscribedAt = m.unsubscribedAt ? new Date(m.unsubscribedAt).toISOString() : "";
        return [esc(m.email), esc(m.name ?? ""), esc(m.source ?? ""), subscribedAt, unsubscribedAt].join(",");
      });
      return { csv: [header, ...rows].join("\n"), count: members.length };
    }),

  addMember: protectedProcedure
    .input(
      z.object({
        listId: z.number(),
        email: z.string().email(),
        name: z.string().max(256).optional(),
        contactId: z.number().optional(),
        source: z.string().max(64).optional().default("manual"),
      }),
    )
    .mutation(async ({ input }) => {
      await addListMember({
        listId: input.listId,
        email: input.email,
        name: input.name,
        contactId: input.contactId,
        source: input.source,
      });
      return { success: true };
    }),

  removeMember: protectedProcedure
    .input(z.object({ listId: z.number(), email: z.string().email() }))
    .mutation(async ({ input }) => {
      await removeListMember(input.listId, input.email);
      return { success: true };
    }),

  addContactToDefaultLists: protectedProcedure
    .input(
      z.object({
        contactId: z.number(),
        email: z.string().email(),
        name: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      await addContactToDefaultLists(input.contactId, input.email, input.name);
      return { success: true };
    }),

  // ── Campaigns ──────────────────────────────────────────────────────────────

  getCampaigns: protectedProcedure.query(async () => {
    return getCampaigns();
  }),

  getCampaign: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const campaign = await getCampaignById(input.id);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      return campaign;
    }),

  createCampaign: protectedProcedure
    .input(
      z.object({
        listId: z.number(),
        subject: z.string().min(1).max(256),
        previewText: z.string().max(256).optional(),
        fromName: z.string().max(128).optional(),
        fromEmail: z.string().email().optional(),
        htmlBody: z.string().min(1),
        templateType: z
          .enum(["campaign_blast", "new_lead_welcome", "tour_reminder", "custom"])
          .optional()
          .default("campaign_blast"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const adminId = (ctx as any).adminId as number | undefined;
      return createCampaign({
        listId: input.listId,
        subject: input.subject,
        previewText: input.previewText,
        fromName: input.fromName ?? "Apollo Home Builders",
        fromEmail: input.fromEmail ?? "hello@apollohomebuilders.com",
        htmlBody: input.htmlBody,
        templateType: input.templateType,
        createdBy: adminId,
      });
    }),

  updateCampaign: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        subject: z.string().min(1).max(256).optional(),
        previewText: z.string().max(256).optional(),
        htmlBody: z.string().optional(),
        listId: z.number().optional(),
        fromName: z.string().max(128).optional(),
        fromEmail: z.string().email().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateCampaign(id, data);
      return { success: true };
    }),

  deleteCampaign: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const campaign = await getCampaignById(input.id);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      if (campaign.status === "sending" || campaign.status === "sent") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete a sent or sending campaign" });
      }
      await deleteCampaign(input.id);
      return { success: true };
    }),

  // ── Send ───────────────────────────────────────────────────────────────────

  sendCampaign: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        origin: z.string().url(), // frontend passes window.location.origin
      }),
    )
    .mutation(async ({ input }) => {
      const campaign = await getCampaignById(input.campaignId);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      if (campaign.status === "sent" || campaign.status === "sending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Campaign already sent or sending" });
      }

      const members = await getListMembers(campaign.listId);
      if (members.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No members in the selected list" });
      }

      // Mark campaign as sending
      await updateCampaign(campaign.id, { status: "sending", totalRecipients: members.length });

      const resend = getResend();
      const sendRows = [];
      let successCount = 0;

      for (const member of members) {
        // Skip unsubscribed
        const unsub = await isUnsubscribed(member.email);
        if (unsub) continue;

        const unsubUrl = buildUnsubscribeUrl(member.email, campaign.id, input.origin);
        const htmlWithUnsub = campaign.htmlBody.replace(
          "{{UNSUBSCRIBE_URL}}",
          unsubUrl,
        );

        try {
          const result = await resend.emails.send({
            from: `${campaign.fromName} <${campaign.fromEmail}>`,
            to: member.email,
            subject: campaign.subject,
            html: htmlWithUnsub,
            headers: {
              "List-Unsubscribe": `<${unsubUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          });

          sendRows.push({
            campaignId: campaign.id,
            email: member.email,
            name: member.name ?? undefined,
            resendMessageId: result.data?.id ?? undefined,
            status: "sent" as const,
            sentAt: new Date(),
          });
          successCount++;
        } catch {
          sendRows.push({
            campaignId: campaign.id,
            email: member.email,
            name: member.name ?? undefined,
            status: "failed" as const,
          });
        }
      }

      await bulkCreateEmailSends(sendRows);
      await updateCampaign(campaign.id, {
        status: "sent",
        sentAt: new Date(),
        totalRecipients: successCount,
      });

      return { success: true, sent: successCount, total: members.length };
    }),

  // ── Unsubscribes ───────────────────────────────────────────────────────────

  getUnsubscribes: protectedProcedure.query(async () => {
    return getUnsubscribes();
  }),

  unsubscribe: publicProcedure
    .input(
      z.object({
        token: z.string(),
        reason: z.string().max(256).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      let email: string;
      let campaignId: number | undefined;
      try {
        const decoded = JSON.parse(Buffer.from(input.token, "base64url").toString());
        email = decoded.email;
        campaignId = decoded.campaignId;
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid unsubscribe token" });
      }
      await recordUnsubscribe({ email, campaignId, reason: input.reason });
      return { success: true, email };
    }),

  // ── Sequences ──────────────────────────────────────────────────────────────

  listSequences: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(emailSequences).orderBy(desc(emailSequences.createdAt));
  }),

  createSequence: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(256),
        trigger: z.string().min(1).max(256),
        emailCount: z.number().int().min(1).max(52).default(1),
        window: z.string().min(1).max(64).default("7 days"),
        goal: z.string().max(256).optional(),
        status: z.enum(["active", "draft", "paused"]).default("draft"),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [result] = await db.insert(emailSequences).values({
        name: input.name,
        trigger: input.trigger,
        emailCount: input.emailCount,
        window: input.window,
        goal: input.goal,
        status: input.status,
      });
      return { id: (result as { insertId: number }).insertId, ...input };
    }),

  updateSequenceStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["active", "draft", "paused"]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(emailSequences).set({ status: input.status }).where(eq(emailSequences.id, input.id));
      return { success: true };
    }),

  deleteSequence: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(emailSequences).where(eq(emailSequences.id, input.id));
      return { success: true };
    }),

  // ── Analytics ──────────────────────────────────────────────────────────────

  getOverallStats: protectedProcedure.query(async () => {
    return getOverallEmailStats();
  }),

  getCampaignStats: protectedProcedure
    .input(z.object({ campaignId: z.number().optional() }))
    .query(async ({ input }) => {
      return getCampaignStats(input.campaignId);
    }),

  // ── Resend Audience Stats ──────────────────────────────────────────────────

  getResendAudienceStats: protectedProcedure.query(async () => {
    try {
      const resend = getResend();
      const result = await resend.contacts.list();
      if (result.error) {
        return { total: 0, active: 0, unsubscribed: 0, error: result.error.message };
      }
      const contacts = result.data?.data ?? [];
      const total = contacts.length;
      const unsubscribed = contacts.filter((c) => c.unsubscribed).length;
      const active = total - unsubscribed;
      return { total, active, unsubscribed, error: null };
    } catch (err: any) {
      return { total: 0, active: 0, unsubscribed: 0, error: err?.message ?? "Unknown error" };
    }
  }),
});

export type EmailRouter = typeof emailRouter;
