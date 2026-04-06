/**
 * seed-scops-team.mjs
 * Seeds the initial SCOPS team members: Kyle (super_admin), Brandon (admin), Jonathan (admin)
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const team = [
  { name: "Kyle", email: "kyle@apollohomebuilders.com", role: "super_admin" },
  { name: "Brandon", email: "brandon@apollohomebuilders.com", role: "admin" },
  { name: "Jonathan", email: "jonathan@apollohomebuilders.com", role: "admin" },
];

for (const member of team) {
  const [existing] = await conn.execute(
    "SELECT id FROM scopsTeam WHERE email = ?",
    [member.email]
  );
  if (existing.length === 0) {
    await conn.execute(
      "INSERT INTO scopsTeam (name, email, role, active) VALUES (?, ?, ?, 1)",
      [member.name, member.email, member.role]
    );
    console.log(`✅ Added ${member.name} (${member.role})`);
  } else {
    console.log(`⏭  ${member.name} already exists`);
  }
}

await conn.end();
console.log("Done.");
