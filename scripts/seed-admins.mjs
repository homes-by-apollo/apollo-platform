/**
 * One-time seed script: inserts/updates all three Apollo admin accounts
 * in the adminCredentials table with a fresh bcrypt hash.
 *
 * Run with:  node scripts/seed-admins.mjs
 */
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const PASSWORD = "Pahrump2026!$#";
const ADMINS = [
  { email: "kyle@apollohomebuilders.com",     name: "Kyle" },
  { email: "brandon@apollohomebuilders.com",  name: "Brandon" },
  { email: "jonathan@apollohomebuilders.com", name: "Jonathan" },
];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const hash = await bcrypt.hash(PASSWORD, 10);
  console.log("Generated hash:", hash);

  for (const admin of ADMINS) {
    // Check if row exists
    const [rows] = await conn.execute(
      "SELECT id FROM adminCredentials WHERE email = ?",
      [admin.email]
    );
    if (rows.length > 0) {
      await conn.execute(
        "UPDATE adminCredentials SET passwordHash = ?, name = ?, updatedAt = NOW() WHERE email = ?",
        [hash, admin.name, admin.email]
      );
      console.log(`✅ Updated: ${admin.email}`);
    } else {
      await conn.execute(
        "INSERT INTO adminCredentials (email, name, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())",
        [admin.email, admin.name, hash]
      );
      console.log(`✅ Inserted: ${admin.email}`);
    }
  }

  await conn.end();
  console.log("\nAll admin accounts ready. Password: Pahrump2026!$#");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
