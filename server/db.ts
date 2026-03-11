import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  ActivityLog,
  Contact,
  InsertActivityLog,
  InsertContact,
  InsertEmailLog,
  InsertUser,
  Property,
  InsertProperty,
  activityLog,
  contacts,
  emailLog,
  properties,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  // Admin email whitelist — these accounts are always promoted to admin on login
  const ADMIN_EMAILS = [
    "kyle@apollohomebuilders.com",
    "brandon@apollohomebuilders.com",
    "kyle@workplaypartners.com",
  ];
  const isAdminEmail = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId || isAdminEmail) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Lead Score Calculator ────────────────────────────────────────────────────

export function calculateLeadScore(
  timeline: Contact["timeline"],
  financingStatus: Contact["financingStatus"],
  priceRangeMin?: number | null,
  priceRangeMax?: number | null
): Contact["leadScore"] {
  const hotTimeline = timeline === "ASAP" || timeline === "1_3_MONTHS";
  const warmTimeline = timeline === "3_6_MONTHS";
  const hotFinancing = financingStatus === "PRE_APPROVED" || financingStatus === "CASH_BUYER";
  const warmFinancing = financingStatus === "IN_PROCESS";

  // Price range overlap check: Apollo range is $450K–$600K
  const apolloMin = 450000;
  const apolloMax = 600000;
  const priceOverlap =
    !priceRangeMin && !priceRangeMax
      ? true // no range provided — don't penalize
      : (priceRangeMax ?? Infinity) >= apolloMin && (priceRangeMin ?? 0) <= apolloMax;

  if (hotTimeline && hotFinancing && priceOverlap) return "HOT";
  if (warmTimeline || warmFinancing || (hotTimeline && priceOverlap)) return "WARM";
  return "COLD";
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export async function createContact(data: InsertContact): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Auto-calculate lead score for buyers
  if (data.contactType === "BUYER" && !data.leadScore) {
    data.leadScore = calculateLeadScore(
      data.timeline ?? null,
      data.financingStatus ?? null,
      data.priceRangeMin,
      data.priceRangeMax
    );
  }

  const result = await db.insert(contacts).values(data);
  return Number((result[0] as { insertId: number }).insertId);
}

export async function getContacts(filters?: {
  pipelineStage?: Contact["pipelineStage"];
  contactType?: Contact["contactType"];
  leadScore?: Contact["leadScore"];
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.pipelineStage) conditions.push(eq(contacts.pipelineStage, filters.pipelineStage));
  if (filters?.contactType) conditions.push(eq(contacts.contactType, filters.contactType));
  if (filters?.leadScore) conditions.push(eq(contacts.leadScore, filters.leadScore));

  return db
    .select()
    .from(contacts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(contacts.createdAt));
}

export async function getContactById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateContact(id: number, data: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Recalculate lead score if qualification fields changed
  if (data.timeline !== undefined || data.financingStatus !== undefined || data.priceRangeMin !== undefined || data.priceRangeMax !== undefined) {
    const existing = await getContactById(id);
    if (existing) {
      data.leadScore = calculateLeadScore(
        (data.timeline ?? existing.timeline) ?? null,
        (data.financingStatus ?? existing.financingStatus) ?? null,
        data.priceRangeMin ?? existing.priceRangeMin,
        data.priceRangeMax ?? existing.priceRangeMax
      );
    }
  }

  await db.update(contacts).set(data).where(eq(contacts.id, id));
}

// ─── Pipeline Stage Counts (for funnel chart) ─────────────────────────────────

export async function getStageCounts() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      stage: contacts.pipelineStage,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(contacts)
    .groupBy(contacts.pipelineStage);
}

export async function getNewLeadsThisWeek() {
  const db = await getDb();
  if (!db) return 0;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(contacts)
    .where(sql`${contacts.createdAt} >= ${weekAgo}`);
  return result[0]?.count ?? 0;
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export async function getSourceCounts(period?: "7d" | "30d" | "all") {
  const db = await getDb();
  if (!db) return [];
  const cutoff =
    period === "7d"
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      : period === "30d"
        ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        : null;
  const query = db
    .select({
      source: contacts.source,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(contacts);
  if (cutoff) {
    return query.where(gte(contacts.createdAt, cutoff)).groupBy(contacts.source);
  }
  return query.groupBy(contacts.source);
}

export async function logActivity(data: InsertActivityLog): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLog).values(data);
}

export async function getActivityForContact(contactId: number): Promise<ActivityLog[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(activityLog)
    .where(eq(activityLog.contactId, contactId))
    .orderBy(desc(activityLog.createdAt));
}

// ─── Email Log ────────────────────────────────────────────────────────────────

export async function logEmail(data: InsertEmailLog): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(emailLog).values(data);
}

export async function getEmailsForContact(contactId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(emailLog)
    .where(eq(emailLog.contactId, contactId))
    .orderBy(desc(emailLog.sentAt));
}

// ─── Properties ───────────────────────────────────────────────────────────────

export async function getFeaturedProperties(): Promise<Property[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(properties)
    .where(eq(properties.featured, 1))
    .orderBy(properties.sortOrder, desc(properties.createdAt));
}

export async function getAllProperties(filters?: {
  propertyType?: Property["propertyType"];
  tag?: Property["tag"];
}): Promise<Property[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.propertyType) conditions.push(eq(properties.propertyType, filters.propertyType));
  if (filters?.tag) conditions.push(eq(properties.tag, filters.tag));
  return db
    .select()
    .from(properties)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(properties.sortOrder, desc(properties.createdAt));
}

export async function getPropertyById(id: number): Promise<Property | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProperty(data: InsertProperty): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(properties).values(data);
  return Number((result[0] as { insertId: number }).insertId);
}

export async function updateProperty(id: number, data: Partial<InsertProperty>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(properties).set(data).where(eq(properties.id, id));
}

export async function deleteProperty(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(properties).where(eq(properties.id, id));
}
