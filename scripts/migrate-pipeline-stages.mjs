/**
 * Migrates existing contacts from old pipeline stages to new ones.
 * Must run BEFORE db:push changes the enum.
 *
 * Old → New mapping:
 *   NEW_LEAD        → NEW_INQUIRY
 *   CONTACTED       → NEW_INQUIRY
 *   NURTURE         → QUALIFIED
 *   SQL             → QUALIFIED
 *   TOUR_SCHEDULED  → TOUR_SCHEDULED (same)
 *   TOUR_COMPLETED  → TOURED
 *   PROPOSAL_SENT   → OFFER_SUBMITTED
 *   CONTRACT_SIGNED → UNDER_CONTRACT
 *   IN_CONSTRUCTION → UNDER_CONTRACT
 *   CLOSED          → CLOSED (same)
 *   LOST            → LOST (same)
 */

import mysql from "mysql2/promise";

const db = await mysql.createConnection(process.env.DATABASE_URL);

const mappings = [
  ["NEW_LEAD", "NEW_INQUIRY"],
  ["CONTACTED", "NEW_INQUIRY"],
  ["NURTURE", "QUALIFIED"],
  ["SQL", "QUALIFIED"],
  ["TOUR_COMPLETED", "TOURED"],
  ["PROPOSAL_SENT", "OFFER_SUBMITTED"],
  ["CONTRACT_SIGNED", "UNDER_CONTRACT"],
  ["IN_CONSTRUCTION", "UNDER_CONTRACT"],
];

// First: temporarily widen the enum to include ALL values (old + new)
await db.execute(`
  ALTER TABLE contacts MODIFY COLUMN pipelineStage ENUM(
    'NEW_LEAD','CONTACTED','NURTURE','SQL',
    'TOUR_SCHEDULED','TOUR_COMPLETED','PROPOSAL_SENT',
    'CONTRACT_SIGNED','IN_CONSTRUCTION','CLOSED','LOST',
    'NEW_INQUIRY','QUALIFIED','TOURED','OFFER_SUBMITTED','UNDER_CONTRACT'
  ) NOT NULL DEFAULT 'NEW_INQUIRY'
`);
console.log("Widened enum to include all old + new values");

// Then: remap old values to new
for (const [oldVal, newVal] of mappings) {
  const [result] = await db.execute(
    `UPDATE contacts SET pipelineStage = ? WHERE pipelineStage = ?`,
    [newVal, oldVal]
  );
  console.log(`  ${oldVal} → ${newVal}: ${result.affectedRows} rows`);
}

console.log("All pipeline stages migrated. Now run pnpm db:push.");
await db.end();
