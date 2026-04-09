import { and, desc, eq, gte, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  ActivityLog,
  BlogPost,
  Contact,
  InsertActivityLog,
  InsertBlogPost,
  InsertContact,
  InsertEmailLog,
  InsertUser,
  Property,
  InsertProperty,
  activityLog,
  blogPosts,
  contacts,
  deals,
  emailLog,
  leadPropertyInterest,
  properties,
  scheduledTours,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: MySql2Database | null = null;
let _pool: mysql.Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      });
      _db = drizzle(_pool);
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
    "kyle@kylekelly.co",
    "brandon@lvservicesolutions.com",
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

  const rows = await db
    .select()
    .from(contacts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(contacts.createdAt));

  if (rows.length === 0) return [];

  // Fetch PDF download counts for all contacts in one query
  const ids = rows.map(r => r.id);
  const pdfCounts = await db
    .select({
      contactId: activityLog.contactId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(activityLog)
    .where(and(inArray(activityLog.contactId, ids), eq(activityLog.activityType, "PDF_DOWNLOADED")))
    .groupBy(activityLog.contactId);
  const pdfCountMap = new Map(pdfCounts.map(r => [r.contactId, r.count]));

  return rows.map(r => ({ ...r, pdfDownloadCount: pdfCountMap.get(r.id) ?? 0 }));
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

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export async function getFeaturedBlogPosts(): Promise<BlogPost[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.featured, 1), eq(blogPosts.status, "published")))
    .orderBy(blogPosts.sortOrder, desc(blogPosts.publishedAt))
    .limit(3);
}

/** Public: only published posts */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(blogPosts.sortOrder, desc(blogPosts.publishedAt));
}

/** Admin: all posts including drafts */
export async function getAllBlogPostsAdmin(): Promise<BlogPost[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(blogPosts)
    .orderBy(blogPosts.sortOrder, desc(blogPosts.publishedAt));
}

export async function getBlogPostById(id: number): Promise<BlogPost | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRelatedBlogPosts(category: string, excludeId: number): Promise<BlogPost[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.status, "published"),
        eq(blogPosts.category, category),
        sql`${blogPosts.id} != ${excludeId}`
      )
    )
    .orderBy(desc(blogPosts.publishedAt))
    .limit(3);
}

export async function createBlogPost(data: InsertBlogPost): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(blogPosts).values(data);
  return Number((result[0] as { insertId: number }).insertId);
}

export async function updateBlogPost(id: number, data: Partial<InsertBlogPost>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(blogPosts).set(data).where(eq(blogPosts.id, id));
}

export async function deleteBlogPost(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
}

// ─── UTM Attribution Counts ───────────────────────────────────────────────────

export async function getUtmSourceCounts(period?: "7d" | "30d" | "all") {
  const db = await getDb();
  if (!db) return [];
  const cutoff =
    period === "7d"
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      : period === "30d"
        ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        : null;
  const conditions = cutoff
    ? and(isNotNull(contacts.utmSource), gte(contacts.createdAt, cutoff))
    : isNotNull(contacts.utmSource);
  return db
    .select({
      utmSource: contacts.utmSource,
      utmMedium: contacts.utmMedium,
      utmCampaign: contacts.utmCampaign,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(contacts)
    .where(conditions)
    .groupBy(contacts.utmSource, contacts.utmMedium, contacts.utmCampaign)
    .orderBy(desc(sql<number>`count(*)`));
}

// ─── Dashboard: Inventory Stats ───────────────────────────────────────────────

export async function getInventoryStats() {
  const db = await getDb();
  if (!db) return { available: 0, underContract: 0, soldLast30: 0, revenueMtd: 0 };

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [available, underContract, soldLast30, revenueMtd] = await Promise.all([
    db.select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(properties)
      .where(eq(properties.tag, "Available")),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(properties)
      .where(eq(properties.tag, "Under Contract")),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(deals)
      .where(and(eq(deals.stage, "CLOSED"), gte(deals.actualCloseDate, thirtyDaysAgo))),
    db.select({ total: sql<number>`coalesce(sum(amount), 0)`.mapWith(Number) })
      .from(deals)
      .where(and(eq(deals.stage, "CLOSED"), gte(deals.actualCloseDate, startOfMonth))),
  ]);

  return {
    available: available[0]?.count ?? 0,
    underContract: underContract[0]?.count ?? 0,
    soldLast30: soldLast30[0]?.count ?? 0,
    revenueMtd: revenueMtd[0]?.total ?? 0,
  };
}

// ─── Dashboard: Tours This Week ───────────────────────────────────────────────

export async function getToursThisWeek() {
  const db = await getDb();
  if (!db) return 0;
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const result = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(scheduledTours)
    .where(
      and(
        eq(scheduledTours.status, "ACTIVE"),
        gte(scheduledTours.startTime, startOfWeek),
        sql`${scheduledTours.startTime} < ${endOfWeek}`
      )
    );
  return result[0]?.count ?? 0;
}

// ─── Dashboard: Absorption Rate ───────────────────────────────────────────────

export async function getAbsorptionRate() {
  const db = await getDb();
  if (!db) return null;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [soldResult, totalResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(deals)
      .where(and(eq(deals.stage, "CLOSED"), gte(deals.actualCloseDate, thirtyDaysAgo))),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(properties)
      .where(sql`${properties.tag} != 'Sold'`),
  ]);

  const sold = soldResult[0]?.count ?? 0;
  const total = totalResult[0]?.count ?? 0;
  if (total === 0) return null;
  return Math.round((sold / total) * 100);
}

// ─── Dashboard: Revenue Forecast ─────────────────────────────────────────────

export async function getRevenueForecast() {
  const db = await getDb();
  if (!db) return { days30: 0, days60: 0, days90: 0, activeDeals: 0, totalForecast: 0 };

  const now = new Date();
  const d30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const d60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const d90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({ amount: deals.amount, expectedCloseDate: deals.expectedCloseDate })
    .from(deals)
    .where(
      and(
        sql`${deals.stage} IN ('OFFER_SUBMITTED', 'UNDER_CONTRACT')`,
        isNotNull(deals.amount)
      )
    );

  // Count all active deals (regardless of close date)
  const activeDeals = rows.length;

  let days30 = 0, days60 = 0, days90 = 0;
  for (const row of rows) {
    if (!row.amount) continue;
    if (!row.expectedCloseDate) {
      // No close date — count toward 90-day bucket
      days90 += row.amount;
      continue;
    }
    const closeDate = new Date(row.expectedCloseDate);
    if (closeDate <= d30) days30 += row.amount;
    else if (closeDate <= d60) days60 += row.amount;
    else days90 += row.amount;
  }

  return { days30, days60, days90, activeDeals, totalForecast: days30 + days60 + days90 };
}

// ─── Dashboard: Deals At Risk ─────────────────────────────────────────────────

export async function getDealsAtRisk() {
  const db = await getDb();
  if (!db) return [];

  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // Leads not contacted in 48+ hours (active, not lost/closed)
  const notContacted = await db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      pipelineStage: contacts.pipelineStage,
      lastContactedAt: contacts.lastContactedAt,
      primaryPropertyId: contacts.primaryPropertyId,
      leadScore: contacts.leadScore,
    })
    .from(contacts)
    .where(
      and(
        sql`${contacts.pipelineStage} NOT IN ('CLOSED', 'LOST')`,
        or(
          isNull(contacts.lastContactedAt),
          sql`${contacts.lastContactedAt} < ${fortyEightHoursAgo}`
        )
      )
    )
    .orderBy(contacts.lastContactedAt)
    .limit(10);

  // Fetch property addresses for each at-risk lead
  const propertyIds = notContacted
    .map(c => c.primaryPropertyId)
    .filter((id): id is number => id !== null && id !== undefined);

  const propRows = propertyIds.length > 0
    ? await db.select({ id: properties.id, address: properties.address })
        .from(properties)
        .where(sql`${properties.id} IN (${sql.join(propertyIds.map(id => sql`${id}`), sql`, `)})`)
    : [];

  const propMap = Object.fromEntries(propRows.map(p => [p.id, p.address]));

  return notContacted.map(c => {
    const hoursAgo = c.lastContactedAt
      ? Math.floor((Date.now() - new Date(c.lastContactedAt).getTime()) / (1000 * 60 * 60))
      : null;
    const issueType = !c.lastContactedAt
      ? "Never contacted"
      : hoursAgo! > 168
      ? `Silent ${Math.floor(hoursAgo! / 24)}d — needs outreach`
      : `No follow-up in ${hoursAgo}h`;
    return {
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      stage: c.pipelineStage,
      leadScore: c.leadScore,
      issue: issueType,
      hoursStale: hoursAgo ?? 9999,
      lastContactedAt: c.lastContactedAt,
      primaryPropertyId: c.primaryPropertyId,
      primaryPropertyAddress: c.primaryPropertyId ? (propMap[c.primaryPropertyId] ?? null) : null,
    };
  });
}

// ─── Dashboard: Inventory Health ─────────────────────────────────────────────

export async function getInventoryHealth() {
  const db = await getDb();
  if (!db) return [];

  // Get all available properties with lead interest counts
  const props = await db
    .select()
    .from(properties)
    .where(eq(properties.tag, "Available"))
    .orderBy(desc(properties.createdAt));

  // Get lead counts per property
  const leadCounts = await db
    .select({
      propertyId: contacts.primaryPropertyId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(contacts)
    .where(isNotNull(contacts.primaryPropertyId))
    .groupBy(contacts.primaryPropertyId);

  const leadMap = Object.fromEntries(leadCounts.map(r => [r.propertyId, r.count]));

  // Get tour counts per property via contact's primaryPropertyId
  const tourCounts = await db
    .select({
      propertyId: contacts.primaryPropertyId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(scheduledTours)
    .innerJoin(contacts, eq(scheduledTours.contactId, contacts.id))
    .where(isNotNull(contacts.primaryPropertyId))
    .groupBy(contacts.primaryPropertyId);

  const tourMap = Object.fromEntries(tourCounts.map(r => [r.propertyId, r.count]));

  return props.map(p => {
    const createdDate = new Date(p.createdAt);
    const dom = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const leadCount = leadMap[p.id] ?? 0;
    const tourCount = tourMap[p.id] ?? 0;
    // Classify the health issue
    let healthFlag: "high_dom" | "zero_tours" | "high_interest_no_offer" | "ok" = "ok";
    if (dom > 60) healthFlag = "high_dom";
    else if (leadCount > 3 && tourCount === 0) healthFlag = "zero_tours";
    else if (tourCount > 2 && leadCount > 4) healthFlag = "high_interest_no_offer";
    return {
      id: p.id,
      address: p.address,
      price: p.price,
      priceValue: p.priceValue,
      dom,
      leadCount,
      tourCount,
      healthFlag,
      imageUrl: p.imageUrl ?? null,
    };
  });
}

// ─── Dashboard: Source Performance ───────────────────────────────────────────

export async function getSourcePerformance() {
  const db = await getDb();
  if (!db) return [];

  const sources = ["WEBSITE", "ZILLOW", "REFERRAL", "AGENT", "OTHER"] as const;

  const [leadRows, tourRows, contractRows] = await Promise.all([
    db.select({
      source: contacts.source,
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(contacts).groupBy(contacts.source),

    db.select({
      source: contacts.source,
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(contacts)
      .where(sql`${contacts.pipelineStage} IN ('TOUR_SCHEDULED', 'TOURED', 'OFFER_SUBMITTED', 'UNDER_CONTRACT', 'CLOSED')`)
      .groupBy(contacts.source),

    db.select({
      source: contacts.source,
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(contacts)
      .where(sql`${contacts.pipelineStage} IN ('UNDER_CONTRACT', 'CLOSED')`)
      .groupBy(contacts.source),
  ]);

  const leadMap = Object.fromEntries(leadRows.map(r => [r.source, r.count]));
  const tourMap = Object.fromEntries(tourRows.map(r => [r.source, r.count]));
  const contractMap = Object.fromEntries(contractRows.map(r => [r.source, r.count]));

  const SOURCE_LABELS: Record<string, string> = {
    WEBSITE: "Website", ZILLOW: "Zillow", REFERRAL: "Referral",
    AGENT: "Agent", BILLBOARD: "Billboard", WALK_IN: "Walk-In",
    MLS: "MLS", OTHER: "Other",
  };

  return sources.map(src => ({
    source: src,
    label: SOURCE_LABELS[src] ?? src,
    leads: leadMap[src] ?? 0,
    tours: tourMap[src] ?? 0,
    contracts: contractMap[src] ?? 0,
  }));
}

// ─── Dashboard: Recent Activity Feed ─────────────────────────────────────────

export async function getRecentActivity(limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: activityLog.id,
      contactId: activityLog.contactId,
      activityType: activityLog.activityType,
      description: activityLog.description,
      createdAt: activityLog.createdAt,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
    })
    .from(activityLog)
    .leftJoin(contacts, eq(activityLog.contactId, contacts.id))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}

// ─── Pipeline Kanban ──────────────────────────────────────────────────────────

/**
 * Returns all active leads grouped by pipeline stage, enriched with:
 * - primary property address
 * - last activity timestamp
 * - overdue flag (no activity in 48h)
 * - assigned user name
 * Sorted within each stage by: overdue first → HOT → recent activity → rest
 */
export async function getPipelineKanban() {
  const db = await getDb();
  if (!db) return [];

  const OVERDUE_MS = 48 * 60 * 60 * 1000;
  const now = Date.now();

  // Fetch all non-closed/non-lost leads with their primary property
  const rows = await db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      email: contacts.email,
      phone: contacts.phone,
      pipelineStage: contacts.pipelineStage,
      leadScore: contacts.leadScore,
      timeline: contacts.timeline,
      financingStatus: contacts.financingStatus,
      priceRangeMin: contacts.priceRangeMin,
      priceRangeMax: contacts.priceRangeMax,
      nextAction: contacts.nextAction,
      lastContactedAt: contacts.lastContactedAt,
      tourDate: contacts.tourDate,
      createdAt: contacts.createdAt,
      updatedAt: contacts.updatedAt,
      assignedTo: contacts.assignedTo,
      primaryPropertyId: contacts.primaryPropertyId,
      stageEnteredAt: contacts.stageEnteredAt,
      propertyAddress: properties.address,
      propertyPrice: properties.price,
      assignedUserName: users.name,
    })
    .from(contacts)
    .leftJoin(properties, eq(contacts.primaryPropertyId, properties.id))
    .leftJoin(users, eq(contacts.assignedTo, users.id))
    .orderBy(desc(contacts.updatedAt));

  // Enrich with overdue flag and urgency score
  return rows.map(row => {
    const lastActivity = row.lastContactedAt ?? row.updatedAt ?? row.createdAt;
    const msSince = lastActivity ? now - new Date(lastActivity).getTime() : Infinity;
    const isOverdue = msSince > OVERDUE_MS;
    const urgencyScore =
      (isOverdue ? 1000 : 0) +
      (row.leadScore === "HOT" ? 100 : row.leadScore === "WARM" ? 50 : 0) +
      Math.floor(msSince / 1000 / 60); // minutes since last activity
    return { ...row, isOverdue, urgencyScore, lastActivityAt: lastActivity };
  });
}

/**
 * Returns aggregate pipeline insights: total value, conversion rate,
 * avg days in stage, and bottleneck stage.
 */
export async function getPipelineInsights() {
  const db = await getDb();
  if (!db) return { totalPipelineValue: 0, conversionRate: 0, avgDaysInStage: 0, bottleneckStage: "NEW_INQUIRY" as string, activeDealCount: 0 };

  const allLeads = await db.select({
    pipelineStage: contacts.pipelineStage,
    priceRangeMax: contacts.priceRangeMax,
    createdAt: contacts.createdAt,
    updatedAt: contacts.updatedAt,
  }).from(contacts);

  const active = allLeads.filter(l =>
    l.pipelineStage !== "CLOSED" && l.pipelineStage !== "LOST"
  );
  const closed = allLeads.filter(l => l.pipelineStage === "CLOSED");
  const total = allLeads.length;

  const totalPipelineValue = active.reduce((sum, l) => sum + (l.priceRangeMax ?? 350000), 0);
  const conversionRate = total > 0 ? Math.round((closed.length / total) * 1000) / 10 : 0;

  // Avg days in stage (rough: updatedAt - createdAt for active leads)
  const avgDaysInStage = active.length > 0
    ? Math.round(active.reduce((sum, l) => {
        const days = (new Date(l.updatedAt ?? l.createdAt).getTime() - new Date(l.createdAt).getTime()) / 86400000;
        return sum + days;
      }, 0) / active.length)
    : 0;

  // Bottleneck: stage with most leads
  const stageCounts: Record<string, number> = {};
  for (const l of active) {
    stageCounts[l.pipelineStage] = (stageCounts[l.pipelineStage] ?? 0) + 1;
  }
  const bottleneckStage = Object.entries(stageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "NEW_INQUIRY";

  return {
    totalPipelineValue,
    conversionRate,
    avgDaysInStage,
    bottleneckStage,
    activeDealCount: active.length,
  };
}
