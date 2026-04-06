import mysql from "mysql2/promise";

const db = await mysql.createConnection(process.env.DATABASE_URL);

// 1. Add missing columns to contacts (if they don't already exist)
const [cols] = await db.execute("DESCRIBE contacts");
const existing = cols.map(c => c.Field);

if (!existing.includes("primaryPropertyId")) {
  await db.execute("ALTER TABLE contacts ADD COLUMN primaryPropertyId INT");
  console.log("Added primaryPropertyId");
}
if (!existing.includes("lastContactedAt")) {
  await db.execute("ALTER TABLE contacts ADD COLUMN lastContactedAt TIMESTAMP NULL");
  console.log("Added lastContactedAt");
}
if (!existing.includes("nextAction")) {
  await db.execute("ALTER TABLE contacts ADD COLUMN nextAction VARCHAR(256)");
  console.log("Added nextAction");
}

// 2. Narrow the pipelineStage enum to only the new values
await db.execute(`
  ALTER TABLE contacts MODIFY COLUMN pipelineStage ENUM(
    'NEW_INQUIRY','QUALIFIED','TOUR_SCHEDULED','TOURED',
    'OFFER_SUBMITTED','UNDER_CONTRACT','CLOSED','LOST'
  ) NOT NULL DEFAULT 'NEW_INQUIRY'
`);
console.log("pipelineStage enum narrowed to new values");

await db.end();
console.log("Migration complete.");
