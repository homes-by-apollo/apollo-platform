/**
 * Email Marketing — Database helpers
 * All queries return raw Drizzle rows; business logic lives in the router.
 */

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  emailCampaigns,
  emailListMembers,
  emailLists,
  emailSends,
  emailUnsubscribes,
  type EmailCampaign,
  type EmailList,
  type EmailListMember,
  type EmailSend,
  type EmailUnsubscribe,
  type InsertEmailCampaign,
  type InsertEmailList,
  type InsertEmailListMember,
  type InsertEmailSend,
  type InsertEmailUnsubscribe,
} from "../drizzle/schema";

// ─── Lists ────────────────────────────────────────────────────────────────────

export async function createEmailList(data: InsertEmailList): Promise<EmailList> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(emailLists).values(data);
  const id = (result as any).insertId as number;
  const [row] = await db.select().from(emailLists).where(eq(emailLists.id, id));
  return row;
}

export async function getEmailLists(): Promise<(EmailList & { memberCount: number; unsubscribedCount: number })[]> {
  const db = await getDb();
  if (!db) return [];
  const lists = await db.select().from(emailLists).orderBy(desc(emailLists.createdAt));
  const counts = await db
    .select({ listId: emailListMembers.listId, count: sql<number>`COUNT(*)` })
    .from(emailListMembers)
    .groupBy(emailListMembers.listId);
  const unsubCounts = await db
    .select({ listId: emailListMembers.listId, count: sql<number>`COUNT(*)` })
    .from(emailListMembers)
    .where(sql`unsubscribedAt IS NOT NULL`)
    .groupBy(emailListMembers.listId);
  const countMap = Object.fromEntries(
    counts.map((c: { listId: number; count: number }) => [c.listId, Number(c.count)])
  );
  const unsubMap = Object.fromEntries(
    unsubCounts.map((c: { listId: number; count: number }) => [c.listId, Number(c.count)])
  );
  return lists.map((l: EmailList) => ({
    ...l,
    memberCount: countMap[l.id] ?? 0,
    unsubscribedCount: unsubMap[l.id] ?? 0,
  }));
}

export async function getEmailListById(id: number): Promise<EmailList | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(emailLists).where(eq(emailLists.id, id));
  return row;
}

export async function updateEmailList(id: number, data: Partial<InsertEmailList>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(emailLists).set(data).where(eq(emailLists.id, id));
}

export async function deleteEmailList(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(emailListMembers).where(eq(emailListMembers.listId, id));
  await db.delete(emailLists).where(eq(emailLists.id, id));
}

// ─── Members ──────────────────────────────────────────────────────────────────

export async function getListMembers(listId: number): Promise<EmailListMember[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(emailListMembers)
    .where(eq(emailListMembers.listId, listId))
    .orderBy(desc(emailListMembers.subscribedAt));
}

export async function addListMember(data: InsertEmailListMember): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(emailListMembers)
    .values(data)
    .onDuplicateKeyUpdate({ set: { name: data.name ?? sql`name` } });
}

export async function removeListMember(listId: number, email: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(emailListMembers)
    .where(and(eq(emailListMembers.listId, listId), eq(emailListMembers.email, email)));
}

/** Add a contact to all lists that have isDefault = 1 */
export async function addContactToDefaultLists(
  contactId: number,
  email: string,
  name: string,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const defaults = await db
    .select()
    .from(emailLists)
    .where(eq(emailLists.isDefault, 1));
  for (const list of defaults) {
    await db
      .insert(emailListMembers)
      .values({ listId: list.id, contactId, email, name, source: "crm_lead" })
      .onDuplicateKeyUpdate({ set: { name } });
  }
}

// ─── Campaigns ────────────────────────────────────────────────────────────────

export async function createCampaign(data: InsertEmailCampaign): Promise<EmailCampaign> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(emailCampaigns).values(data);
  const id = (result as any).insertId as number;
  const [row] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id));
  return row;
}

export async function getCampaigns(): Promise<EmailCampaign[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
}

export async function getCampaignById(id: number): Promise<EmailCampaign | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id));
  return row;
}

export async function updateCampaign(
  id: number,
  data: Partial<InsertEmailCampaign>,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(emailCampaigns).set(data).where(eq(emailCampaigns.id, id));
}

export async function deleteCampaign(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(emailSends).where(eq(emailSends.campaignId, id));
  await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
}

// ─── Sends ────────────────────────────────────────────────────────────────────

export async function createEmailSend(data: InsertEmailSend): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(emailSends).values(data);
}

export async function bulkCreateEmailSends(rows: InsertEmailSend[]): Promise<void> {
  if (rows.length === 0) return;
  const db = await getDb();
  if (!db) return;
  await db.insert(emailSends).values(rows);
}

export async function updateEmailSendStatus(
  id: number,
  status: EmailSend["status"],
  extra?: Partial<InsertEmailSend>,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(emailSends)
    .set({ status, ...extra })
    .where(eq(emailSends.id, id));
}

export async function getEmailSendsByCampaign(campaignId: number): Promise<EmailSend[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailSends).where(eq(emailSends.campaignId, campaignId));
}

// ─── Unsubscribes ─────────────────────────────────────────────────────────────

export async function recordUnsubscribe(data: InsertEmailUnsubscribe): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(emailUnsubscribes)
    .values(data)
    .onDuplicateKeyUpdate({ set: { unsubscribedAt: sql`now()` } });
}

export async function isUnsubscribed(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [row] = await db
    .select({ id: emailUnsubscribes.id })
    .from(emailUnsubscribes)
    .where(eq(emailUnsubscribes.email, email));
  return !!row;
}

export async function getUnsubscribes(): Promise<EmailUnsubscribe[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailUnsubscribes).orderBy(desc(emailUnsubscribes.unsubscribedAt));
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface CampaignStats {
  campaignId: number;
  subject: string;
  sentAt: Date | null;
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export async function getCampaignStats(campaignId?: number): Promise<CampaignStats[]> {
  const db = await getDb();
  if (!db) return [];
  const campaigns = campaignId
    ? await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, campaignId))
    : await db
        .select()
        .from(emailCampaigns)
        .where(inArray(emailCampaigns.status, ["sent", "sending"]))
        .orderBy(desc(emailCampaigns.sentAt));

  const results: CampaignStats[] = [];
  for (const campaign of campaigns) {
    const sends = await db
      .select()
      .from(emailSends)
      .where(eq(emailSends.campaignId, campaign.id));

    const total = sends.length;
    const sent = sends.filter((s: EmailSend) => s.status !== "queued" && s.status !== "failed").length;
    const delivered = sends.filter((s: EmailSend) =>
      ["delivered", "opened", "clicked"].includes(s.status ?? ""),
    ).length;
    const opened = sends.filter((s: EmailSend) =>
      ["opened", "clicked"].includes(s.status ?? ""),
    ).length;
    const clicked = sends.filter((s: EmailSend) => s.status === "clicked").length;
    const bounced = sends.filter((s: EmailSend) => s.status === "bounced").length;
    const failed = sends.filter((s: EmailSend) => s.status === "failed").length;
    const unsubscribed = sends.filter((s: EmailSend) => s.status === "unsubscribed").length;

    results.push({
      campaignId: campaign.id,
      subject: campaign.subject,
      sentAt: campaign.sentAt,
      total,
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      failed,
      unsubscribed,
      openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
      clickRate: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
      bounceRate: sent > 0 ? Math.round((bounced / sent) * 100) : 0,
    });
  }
  return results;
}

export async function getOverallEmailStats() {
  const db = await getDb();
  if (!db) return { totalSent: 0, totalOpened: 0, totalClicked: 0, totalBounced: 0, totalUnsubscribes: 0, openRate: 0, clickRate: 0, bounceRate: 0 };
  const allSends = await db.select().from(emailSends);
  const allUnsubs = await db.select().from(emailUnsubscribes);
  const totalSent = allSends.filter((s: EmailSend) => s.status !== "queued").length;
  const totalOpened = allSends.filter((s: EmailSend) =>
    ["opened", "clicked"].includes(s.status ?? ""),
  ).length;
  const totalClicked = allSends.filter((s: EmailSend) => s.status === "clicked").length;
  const totalBounced = allSends.filter((s: EmailSend) => s.status === "bounced").length;
  return {
    totalSent,
    totalOpened,
    totalClicked,
    totalBounced,
    totalUnsubscribes: allUnsubs.length,
    openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
    clickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
    bounceRate: totalSent > 0 ? Math.round((totalBounced / totalSent) * 100) : 0,
  };
}
