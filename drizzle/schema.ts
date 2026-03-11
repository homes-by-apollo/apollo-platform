import {
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── CRM: Contacts ────────────────────────────────────────────────────────────

/**
 * All Homebuyer and Agent contacts captured from the website form,
 * manual entry, or future Zillow/MLS imports.
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),

  // Contact classification
  contactType: mysqlEnum("contactType", ["BUYER", "AGENT"]).notNull().default("BUYER"),

  // Core identity
  firstName: varchar("firstName", { length: 128 }).notNull(),
  lastName: varchar("lastName", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),

  // Buyer-specific qualification fields
  timeline: mysqlEnum("timeline", [
    "ASAP",
    "1_3_MONTHS",
    "3_6_MONTHS",
    "6_12_MONTHS",
    "JUST_BROWSING",
  ]),
  priceRangeMin: int("priceRangeMin"),   // USD
  priceRangeMax: int("priceRangeMax"),   // USD
  financingStatus: mysqlEnum("financingStatus", [
    "PRE_APPROVED",
    "IN_PROCESS",
    "NOT_STARTED",
    "CASH_BUYER",
  ]),
  lenderName: varchar("lenderName", { length: 128 }),

  // Agent-specific fields
  brokerageName: varchar("brokerageName", { length: 128 }),
  licenseNumber: varchar("licenseNumber", { length: 64 }),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }),

  // Lead metadata
  source: mysqlEnum("source", [
    "WEBSITE",
    "ZILLOW",
    "MLS",
    "REFERRAL",
    "AGENT",
    "BILLBOARD",
    "WALK_IN",
    "OTHER",
  ]).notNull().default("WEBSITE"),

  leadScore: mysqlEnum("leadScore", ["HOT", "WARM", "COLD"]),

  pipelineStage: mysqlEnum("pipelineStage", [
    "NEW_LEAD",
    "CONTACTED",
    "NURTURE",
    "SQL",
    "TOUR_SCHEDULED",
    "TOUR_COMPLETED",
    "PROPOSAL_SENT",
    "CONTRACT_SIGNED",
    "IN_CONSTRUCTION",
    "CLOSED",
    "LOST",
  ]).notNull().default("NEW_LEAD"),

  lossReason: mysqlEnum("lossReason", [
    "BOUGHT_ELSEWHERE",
    "FINANCING_FAILED",
    "TIMELINE_CHANGED",
    "PRICE_TOO_HIGH",
    "NO_RESPONSE",
    "OTHER",
  ]),

  // Internal
  notes: text("notes"),
  assignedTo: int("assignedTo"),          // FK → users.id (nullable)
  referringAgentId: int("referringAgentId"), // FK → contacts.id (nullable, agent)

  // Tour scheduling
  tourDate: timestamp("tourDate"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

// ─── CRM: Activity Log ────────────────────────────────────────────────────────

/**
 * Immutable audit trail: stage changes, notes, call logs per contact.
 */
export const activityLog = mysqlTable("activityLog", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId").notNull(),   // FK → contacts.id
  userId: int("userId"),                   // FK → users.id (nullable for system events)
  activityType: mysqlEnum("activityType", [
    "STAGE_CHANGE",
    "NOTE_ADDED",
    "EMAIL_SENT",
    "CALL_LOGGED",
    "FORM_SUBMITTED",
    "TOUR_SCHEDULED",
    "SCORE_UPDATED",
  ]).notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"),              // JSON string for extra context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;

// ─── CRM: Email Log ───────────────────────────────────────────────────────────

/**
 * Every Resend email sent — template, timestamp, delivery status.
 */
export const emailLog = mysqlTable("emailLog", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId").notNull(),   // FK → contacts.id
  templateId: varchar("templateId", { length: 64 }).notNull(),
  subject: varchar("subject", { length: 256 }).notNull(),
  toEmail: varchar("toEmail", { length: 320 }).notNull(),
  resendId: varchar("resendId", { length: 128 }),  // Resend message ID for webhook correlation
  status: mysqlEnum("status", ["SENT", "DELIVERED", "OPENED", "CLICKED", "BOUNCED", "FAILED"])
    .notNull()
    .default("SENT"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type EmailLog = typeof emailLog.$inferSelect;
export type InsertEmailLog = typeof emailLog.$inferInsert;

// ─── Newsletter Subscribers ───────────────────────────────────────────────────

/**
 * Email addresses subscribed via the footer "Notify Me" form.
 */
export const newsletterSubscribers = mysqlTable("newsletterSubscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  source: varchar("source", { length: 64 }).default("footer").notNull(),
  subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;
