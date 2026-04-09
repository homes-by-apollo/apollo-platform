import {
  boolean,
  decimal,
  double,
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
  stageEnteredAt: timestamp("stageEnteredAt"),   // when the lead entered the current stage
  nextAction: varchar("nextAction", { length: 256 }),
  nextActionDueAt: timestamp("nextActionDueAt"),  // when next action is due

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
    "PDF_DOWNLOADED",
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
  zip: varchar("zip", { length: 16 }).default(""),

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

  // Geocoded coordinates — cached on first lookup to avoid repeated Geocoder API calls
  lat: double("lat"),
  lng: double("lng"),

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
  adminRole: mysqlEnum("adminRole", ["super_admin", "admin", "marketing", "sales"]).notNull().default("admin"),
  receiveStaleAlerts: boolean("receiveStaleAlerts").notNull().default(true),
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

  interestLevel: mysqlEnum("interestLevel", ["INQUIRED", "VIEWED", "SAVED", "TOURED"]).notNull().default("INQUIRED"),
  isPrimaryInterest: int("isPrimaryInterest").notNull().default(0), // 1 = primary property
  rankOrder: int("rankOrder").default(0),
  viewCount: int("viewCount").notNull().default(1),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeadPropertyInterest = typeof leadPropertyInterest.$inferSelect;
export type InsertLeadPropertyInterest = typeof leadPropertyInterest.$inferInsert;

// ─── System Settings ──────────────────────────────────────────────────────────
/**
 * Key-value store for configurable system settings (e.g., stale lead threshold).
 * Each key is unique; values are stored as strings and parsed by the consumer.
 */
export const systemSettings = mysqlTable("systemSettings", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SystemSetting = typeof systemSettings.$inferSelect;

// ─── Follow-Ups ───────────────────────────────────────────────────────────────

/**
 * Scheduled follow-up tasks for a contact.
 * Sales reps log calls, emails, or meetings they need to complete.
 */
export const followUps = mysqlTable("followUps", {
  id: int("id").autoincrement().primaryKey(),

  contactId: int("contactId").notNull(),  // FK → contacts.id

  type: mysqlEnum("type", ["CALL", "EMAIL", "TEXT", "MEETING", "OTHER"]).notNull().default("CALL"),
  note: text("note"),
  dueAt: timestamp("dueAt").notNull(),

  completedAt: timestamp("completedAt"),
  completedBy: int("completedBy"),  // FK → adminCredentials.id

  createdBy: int("createdBy"),      // FK → adminCredentials.id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FollowUp = typeof followUps.$inferSelect;
export type InsertFollowUp = typeof followUps.$inferInsert;

// ─── Appointments ─────────────────────────────────────────────────────────────

/**
 * Manually-logged appointments (tours, meetings, calls) for a contact.
 * Separate from Calendly-synced scheduledTours — these are CRM-native.
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),

  contactId: int("contactId").notNull(),  // FK → contacts.id

  title: varchar("title", { length: 256 }).notNull(),
  type: mysqlEnum("type", ["TOUR", "CALL", "MEETING", "SHOWING", "OTHER"]).notNull().default("TOUR"),
  scheduledAt: timestamp("scheduledAt").notNull(),
  durationMinutes: int("durationMinutes").default(60),
  location: varchar("location", { length: 256 }),
  notes: text("notes"),

  status: mysqlEnum("status", ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).notNull().default("SCHEDULED"),

  createdBy: int("createdBy"),      // FK → adminCredentials.id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// ─── Lead Attachments ─────────────────────────────────────────────────────────

/**
 * Files attached to a contact record (pre-approval letters, ID docs, contracts, etc.).
 * File bytes are stored in S3; only metadata is persisted here.
 */
export const leadAttachments = mysqlTable("leadAttachments", {
  id: int("id").autoincrement().primaryKey(),

  contactId: int("contactId").notNull(),  // FK → contacts.id

  filename: varchar("filename", { length: 256 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),   // S3 key
  fileUrl: text("fileUrl").notNull(),                        // CDN/presigned URL
  mimeType: varchar("mimeType", { length: 128 }),
  sizeBytes: int("sizeBytes"),

  uploadedBy: int("uploadedBy"),    // FK → adminCredentials.id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeadAttachment = typeof leadAttachments.$inferSelect;
export type InsertLeadAttachment = typeof leadAttachments.$inferInsert;

// ─── Contracts ────────────────────────────────────────────────────────────────
/**
 * Purchase agreements / contracts tied to a CRM contact.
 */
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId").notNull(),        // FK → contacts.id
  title: varchar("title", { length: 256 }).notNull().default("Purchase Agreement"),
  purchasePrice: int("purchasePrice"),           // in dollars
  lotAddress: varchar("lotAddress", { length: 512 }),
  contractDate: timestamp("contractDate"),
  status: mysqlEnum("contractStatus", ["PENDING", "EXECUTED", "CANCELLED"]).notNull().default("PENDING"),
  notes: text("notes"),
  createdBy: int("createdBy"),                   // FK → adminCredentials.id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

// ─── Email Marketing: Lists ───────────────────────────────────────────────────

/**
 * Named subscriber lists (e.g. "All Leads", "Hot Leads", "Newsletter").
 * Members are tracked in email_list_members.
 */
export const emailLists = mysqlTable("emailLists", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  isDefault: int("isDefault").notNull().default(0), // 1 = auto-add all new leads
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailList = typeof emailLists.$inferSelect;
export type InsertEmailList = typeof emailLists.$inferInsert;

// ─── Email Marketing: List Members ───────────────────────────────────────────

/**
 * Junction table linking contacts (or raw emails) to a list.
 * contactId is nullable so external/newsletter subscribers can also be members.
 */
export const emailListMembers = mysqlTable("emailListMembers", {
  id: int("id").autoincrement().primaryKey(),
  listId: int("listId").notNull(),          // FK → emailLists.id
  contactId: int("contactId"),              // FK → contacts.id (nullable)
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 256 }),
  source: varchar("source", { length: 64 }).default("manual"), // "crm_lead", "newsletter", "manual"
  subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
});

export type EmailListMember = typeof emailListMembers.$inferSelect;
export type InsertEmailListMember = typeof emailListMembers.$inferInsert;

// ─── Email Marketing: Campaigns ───────────────────────────────────────────────

/**
 * A campaign is a single broadcast email sent to a list.
 * Status flow: draft → scheduled → sending → sent
 */
export const emailCampaigns = mysqlTable("emailCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  listId: int("listId").notNull(),          // FK → emailLists.id
  subject: varchar("subject", { length: 256 }).notNull(),
  previewText: varchar("previewText", { length: 256 }),
  fromName: varchar("fromName", { length: 128 }).default("Apollo Home Builders"),
  fromEmail: varchar("fromEmail", { length: 320 }).default("hello@apollohomebuilders.com"),
  htmlBody: text("htmlBody").notNull(),     // React Email rendered HTML
  templateType: mysqlEnum("templateType", [
    "campaign_blast",
    "new_lead_welcome",
    "tour_reminder",
    "custom",
  ]).notNull().default("campaign_blast"),
  status: mysqlEnum("campaignStatus", [
    "draft",
    "scheduled",
    "sending",
    "sent",
    "cancelled",
  ]).notNull().default("draft"),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  totalRecipients: int("totalRecipients").default(0),
  createdBy: int("createdBy"),              // FK → adminCredentials.id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;

// ─── Email Marketing: Sends (per-recipient tracking) ─────────────────────────

/**
 * One row per recipient per campaign.
 * Tracks delivery, open, and click events (updated via Resend webhooks or polling).
 */
export const emailSends = mysqlTable("emailSends", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),  // FK → emailCampaigns.id
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 256 }),
  resendMessageId: varchar("resendMessageId", { length: 128 }), // Resend message ID
  status: mysqlEnum("sendStatus", [
    "queued",
    "sent",
    "delivered",
    "opened",
    "clicked",
    "bounced",
    "failed",
    "unsubscribed",
  ]).notNull().default("queued"),
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  bouncedAt: timestamp("bouncedAt"),
  failureReason: varchar("failureReason", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailSend = typeof emailSends.$inferSelect;
export type InsertEmailSend = typeof emailSends.$inferInsert;

// ─── Email Marketing: Unsubscribes ───────────────────────────────────────────

/**
 * Global unsubscribe list — any email here is excluded from all future sends.
 * Populated by the one-click unsubscribe link in every campaign email.
 */
export const emailUnsubscribes = mysqlTable("emailUnsubscribes", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  listId: int("listId"),                    // FK → emailLists.id (nullable = global unsub)
  campaignId: int("campaignId"),            // FK → emailCampaigns.id (which email triggered it)
  reason: varchar("reason", { length: 256 }),
  unsubscribedAt: timestamp("unsubscribedAt").defaultNow().notNull(),
});

export type EmailUnsubscribe = typeof emailUnsubscribes.$inferSelect;
export type InsertEmailUnsubscribe = typeof emailUnsubscribes.$inferInsert;

// ─── Email Marketing: Sequences ───────────────────────────────────────────────
/**
 * Email sequences / drip campaigns — multi-step automated email series
 * triggered by a specific event (form submit, Calendly booking, stage change, etc.)
 */
export const emailSequences = mysqlTable("emailSequences", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  trigger: varchar("trigger", { length: 256 }).notNull(),
  emailCount: int("emailCount").notNull().default(1),
  window: varchar("window", { length: 64 }).notNull().default("7 days"),
  goal: varchar("goal", { length: 256 }),
  status: mysqlEnum("seqStatus", ["active", "draft", "paused"]).notNull().default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EmailSequence = typeof emailSequences.$inferSelect;
export type InsertEmailSequence = typeof emailSequences.$inferInsert;

// ─── Floor Plans ─────────────────────────────────────────────────────────────

/**
 * Apollo Home Builder floor plan catalog.
 * Each plan has a unique slug used in the public /floor-plans/:slug URL.
 * The pdfUrl is gated behind an email opt-in (lead magnet: Floor Plan Lookbook).
 */
export const floorPlans = mysqlTable("floorPlans", {
  id: int("id").autoincrement().primaryKey(),

  // Identity
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),

  // Specs
  sqft: int("sqft").notNull(),
  beds: int("beds").notNull(),
  baths: varchar("baths", { length: 16 }).notNull(),   // "2", "2.5", "3/unit"
  garage: int("garage").notNull().default(2),

  // Pricing
  startingPrice: int("startingPrice"),   // USD numeric, null = "Contact for pricing"

  // Content
  description: text("description"),
  imageUrl: text("imageUrl"),            // site plan / floor plan diagram image
  pdfUrl: text("pdfUrl"),               // gated PDF download URL (S3)

  // Flags
  featured: int("featured").notNull().default(0),
  sortOrder: int("sortOrder").notNull().default(0),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FloorPlan = typeof floorPlans.$inferSelect;
export type InsertFloorPlan = typeof floorPlans.$inferInsert;

// ─── Floor Plan PDF Requests ──────────────────────────────────────────────────

/**
 * Lead capture: tracks who requested a floor plan PDF.
 * Used to gate the PDF download behind an email opt-in.
 */
export const floorPlanRequests = mysqlTable("floorPlanRequests", {
  id: int("id").autoincrement().primaryKey(),
  floorPlanId: int("floorPlanId").notNull(),  // FK → floorPlans.id
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 256 }),
  phone: varchar("phone", { length: 32 }),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
});

export type FloorPlanRequest = typeof floorPlanRequests.$inferSelect;
export type InsertFloorPlanRequest = typeof floorPlanRequests.$inferInsert;

// ─── Listing Alerts ───────────────────────────────────────────────────────────

/**
 * Subscribers who opted in for new listing alerts.
 * When a new property is added in SCOPS, a broadcast is triggered to this list.
 */
export const listingAlertSubscribers = mysqlTable("listingAlertSubscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 256 }),
  priceMin: int("priceMin"),
  priceMax: int("priceMax"),
  propertyType: mysqlEnum("alertPropertyType", ["HOME", "LOT", "BOTH"]).default("BOTH"),
  subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribedAt"),
});

export type ListingAlertSubscriber = typeof listingAlertSubscribers.$inferSelect;
export type InsertListingAlertSubscriber = typeof listingAlertSubscribers.$inferInsert;

// ─── Lot Analysis Requests ────────────────────────────────────────────────────
/**
 * Free lot analysis intake form submissions.
 * Captured before the Calendly booking step.
 */
export const lotAnalysisRequests = mysqlTable("lotAnalysisRequests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  lotAddress: varchar("lotAddress", { length: 512 }),
  apn: varchar("apn", { length: 64 }),
  goals: text("goals"),
  timeline: varchar("timeline", { length: 64 }),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});
export type LotAnalysisRequest = typeof lotAnalysisRequests.$inferSelect;
export type InsertLotAnalysisRequest = typeof lotAnalysisRequests.$inferInsert;
