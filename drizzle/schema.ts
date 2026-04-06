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
    "NEW_INQUIRY",
    "QUALIFIED",
    "TOUR_SCHEDULED",
    "TOURED",
    "OFFER_SUBMITTED",
    "UNDER_CONTRACT",
    "CLOSED",
    "LOST",
  ]).notNull().default("NEW_INQUIRY"),

  // Primary property of interest
  primaryPropertyId: int("primaryPropertyId"),
  lastContactedAt: timestamp("lastContactedAt"),
  nextAction: varchar("nextAction", { length: 256 }),

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

  // UTM attribution (ad campaign tracking)
  utmSource: varchar("utmSource", { length: 128 }),    // e.g. "google", "facebook"
  utmMedium: varchar("utmMedium", { length: 128 }),    // e.g. "cpc", "social"
  utmCampaign: varchar("utmCampaign", { length: 256 }), // e.g. "pahrump-homes-spring"
  utmContent: varchar("utmContent", { length: 256 }),  // e.g. "banner-ad-v2"
  utmTerm: varchar("utmTerm", { length: 256 }),        // e.g. "pahrump homes for sale"
  landingPage: varchar("landingPage", { length: 64 }), // e.g. "/get-in-touch", "/find-your-home"

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

// ─── Properties ─────────────────────────────────────────────────────────────

/**
 * Residential properties and lots listed by Apollo Home Builders.
 * The `featured` flag controls which cards appear in the homepage carousel.
 */
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),

  // Classification
  propertyType: mysqlEnum("propertyType", ["HOME", "LOT"]).notNull().default("HOME"),
  tag: mysqlEnum("tag", ["Available", "Coming Soon", "Sold", "Under Contract"]).notNull().default("Available"),

  // Location
  address: varchar("address", { length: 256 }).notNull(),
  city: varchar("city", { length: 128 }).notNull().default("Pahrump"),
  state: varchar("state", { length: 32 }).notNull().default("NV"),

  // Pricing
  price: varchar("price", { length: 64 }).notNull(),   // display string e.g. "$489,000"
  priceValue: int("priceValue"),                        // numeric for sorting/filtering

  // Home-specific
  beds: int("beds"),
  baths: int("baths"),
  sqft: varchar("sqft", { length: 32 }),

  // Lot-specific
  lotSize: varchar("lotSize", { length: 64 }),
  utilities: varchar("utilities", { length: 128 }),

  // Media
  imageUrl: text("imageUrl"),        // primary listing photo
  imageUrls: text("imageUrls"),      // JSON array of gallery URLs

  // Flags
  featured: int("featured").notNull().default(0),  // 1 = show in homepage carousel
  sortOrder: int("sortOrder").notNull().default(0),

  // Description
  description: text("description"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

// ─── Blog Posts ─────────────────────────────────────────────────────────────

/**
 * Blog articles shown on the homepage and blog section.
 * The `featured` flag controls which posts appear in the homepage preview grid.
 */
export const blogPosts = mysqlTable("blogPosts", {
  id: int("id").autoincrement().primaryKey(),

  // Content
  title: varchar("title", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 320 }).unique(),
  author: varchar("author", { length: 128 }).default("Apollo Home Builders"),
  category: varchar("category", { length: 64 }).notNull().default("Tips"),
  excerpt: text("excerpt"),
  body: text("body"),
  readTime: varchar("readTime", { length: 32 }).default("5 min"),
  imageUrl: text("imageUrl"),

  // Flags
  featured: int("featured").notNull().default(1),  // 1 = show on homepage
  sortOrder: int("sortOrder").notNull().default(0),
  status: mysqlEnum("status", ["draft", "published"]).notNull().default("draft"),

  // Scheduling
  scheduledPublishAt: timestamp("scheduledPublishAt"),  // null = no scheduled publish

  // Audit
  lastEditedBy: varchar("lastEditedBy", { length: 128 }),  // admin name who last saved
  lastEditedAt: timestamp("lastEditedAt"),                  // when they saved it

  // Metadata
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

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

// ─── Admin Credentials ────────────────────────────────────────────────────────
/**
 * Email + bcrypt-hashed password for CRM admin access.
 * Passwords are set via environment variables (ADMIN_KYLE_PASSWORD_HASH,
 * ADMIN_BRANDON_PASSWORD_HASH) and seeded on first login attempt.
 */
export const adminCredentials = mysqlTable("adminCredentials", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 256 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminCredential = typeof adminCredentials.$inferSelect;
export type InsertAdminCredential = typeof adminCredentials.$inferInsert;

// ─── Password Reset Tokens ────────────────────────────────────────────────────
/**
 * Short-lived tokens for admin password reset emails.
 * Each token is single-use and expires after 1 hour.
 */
export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// ─── Scheduled Tours (Calendly Sync) ─────────────────────────────────────────

/**
 * Tour appointments synced from Calendly webhooks.
 * Each row represents one booked (or cancelled) event.
 */
export const scheduledTours = mysqlTable("scheduledTours", {
  id: int("id").autoincrement().primaryKey(),

  // Calendly identifiers
  calendlyEventUri: varchar("calendlyEventUri", { length: 512 }).notNull().unique(),
  calendlyInviteeUri: varchar("calendlyInviteeUri", { length: 512 }).notNull().unique(),

  // Invitee info (from Calendly payload)
  inviteeName: varchar("inviteeName", { length: 256 }).notNull(),
  inviteeEmail: varchar("inviteeEmail", { length: 320 }).notNull(),
  inviteePhone: varchar("inviteePhone", { length: 64 }),

  // Event details
  eventName: varchar("eventName", { length: 256 }),   // e.g. "Home Tour - Pahrump"
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  timezone: varchar("timezone", { length: 64 }),
  location: text("location"),                          // meeting location or video link

  // Status
  status: mysqlEnum("status", ["ACTIVE", "CANCELLED"]).notNull().default("ACTIVE"),
  cancelReason: text("cancelReason"),

  // Link to CRM contact (nullable — may not always match)
  contactId: int("contactId"),

  // Raw webhook payload for debugging
  rawPayload: text("rawPayload"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledTour = typeof scheduledTours.$inferSelect;
export type InsertScheduledTour = typeof scheduledTours.$inferInsert;

// ─── SCOPS Team Members ───────────────────────────────────────────────────────

/**
 * SCOPS team members who receive digest emails and operational alerts.
 * Kyle is the super admin and can add/remove members over time.
 */
export const scopsTeam = mysqlTable("scopsTeam", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  role: mysqlEnum("role", ["super_admin", "admin", "member"]).notNull().default("member"),
  active: int("active").notNull().default(1),  // 1 = receives digests
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScopsTeamMember = typeof scopsTeam.$inferSelect;
export type InsertScopsTeamMember = typeof scopsTeam.$inferInsert;

// ─── Deals ────────────────────────────────────────────────────────────────────

/**
 * A deal represents a formal offer or contract between a contact and a property.
 * Used for revenue forecasting and pipeline tracking.
 */
export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),

  contactId: int("contactId").notNull(),
  propertyId: int("propertyId"),

  stage: mysqlEnum("stage", [
    "OFFER_SUBMITTED",
    "UNDER_CONTRACT",
    "CLOSED",
    "LOST",
  ]).notNull().default("OFFER_SUBMITTED"),

  amount: int("amount"),
  expectedCloseDate: timestamp("expectedCloseDate"),
  actualCloseDate: timestamp("actualCloseDate"),

  notes: text("notes"),
  assignedTo: int("assignedTo"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

// ─── Lead Property Interest ───────────────────────────────────────────────────

/**
 * Tracks which properties a lead has shown interest in (views, saves, tours).
 * Powers the Demand Signals section on the dashboard.
 */
export const leadPropertyInterest = mysqlTable("leadPropertyInterest", {
  id: int("id").autoincrement().primaryKey(),

  leadId: int("leadId").notNull(),
  propertyId: int("propertyId").notNull(),

  interestLevel: mysqlEnum("interestLevel", ["VIEWED", "SAVED", "TOURED"]).notNull().default("VIEWED"),
  viewCount: int("viewCount").notNull().default(1),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeadPropertyInterest = typeof leadPropertyInterest.$inferSelect;
export type InsertLeadPropertyInterest = typeof leadPropertyInterest.$inferInsert;
