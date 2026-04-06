/**
 * Fix blog posts: remove em dashes, set slugs, set author.
 * Run with: node scripts/fix-blog-posts.mjs
 */
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

/**
 * Replace em dashes (—) with a contextually appropriate alternative.
 * Rules:
 *   " — " (space em dash space) -> ", " or ": " depending on context, but safest is just ". "
 *   We use a simple replacement: " — " -> " -- " first pass, then clean up.
 *   Actually, best practice: replace " — " with a comma or period depending on context.
 *   For simplicity and correctness, we replace:
 *     " — " -> ", "   (parenthetical/interruptive use)
 *   And standalone "—" (no spaces) -> "-" (compound use)
 */
function removeEmDashes(text) {
  if (!text) return text;
  // Space-padded em dash -> comma+space (most common parenthetical usage)
  let result = text.replace(/ — /g, ", ");
  // Any remaining em dashes (no spaces) -> hyphen
  result = result.replace(/—/g, "-");
  return result;
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

try {
  // Get all three posts
  const [rows] = await connection.execute("SELECT id, title, body, excerpt FROM blogPosts ORDER BY id ASC");
  
  for (const row of rows) {
    const slug = slugify(row.title);
    const cleanBody = removeEmDashes(row.body);
    const cleanExcerpt = removeEmDashes(row.excerpt);
    
    await connection.execute(
      "UPDATE blogPosts SET slug = ?, author = ?, body = ?, excerpt = ? WHERE id = ?",
      [slug, "Kyla Davis", cleanBody, cleanExcerpt, row.id]
    );
    
    console.log(`✓ Updated post ${row.id}: "${row.title}"`);
    console.log(`  slug: ${slug}`);
    
    // Count em dashes removed
    const emDashCount = (row.body?.match(/ — /g) || []).length + (row.body?.match(/—/g) || []).length;
    console.log(`  em dashes removed: ${emDashCount}`);
  }
  
  console.log("\nAll posts updated: em dashes removed, slugs set, author set to Kyla Davis.");
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
} finally {
  await connection.end();
}
