import mysql from "mysql2/promise";

const db = await mysql.createConnection(process.env.DATABASE_URL);

// Publish all three blog posts and set their slugs/author
const posts = [
  {
    slug: "why-pahrump-is-nevadas-best-kept-secret-for-new-home-buyers",
    author: "Kyla Davis",
    status: "published",
  },
  {
    slug: "what-to-expect-during-your-apollo-home-build",
    author: "Kyla Davis",
    status: "published",
  },
  {
    slug: "the-case-for-multi-family-builds-in-southern-nevada",
    author: "Kyla Davis",
    status: "published",
  },
];

// Get all blog posts
const [rows] = await db.query("SELECT id, title, slug, author, status FROM blogPosts ORDER BY id ASC");
console.log("Current blog posts:");
for (const row of rows) {
  console.log(`  [${row.id}] ${row.title} | slug: ${row.slug ?? "null"} | author: ${row.author ?? "null"} | status: ${row.status}`);
}

// Update each post to published with correct slug and author
for (let i = 0; i < rows.length && i < posts.length; i++) {
  const row = rows[i];
  const update = posts[i];
  await db.query(
    "UPDATE blogPosts SET slug = ?, author = ?, status = ?, publishedAt = NOW() WHERE id = ?",
    [update.slug, update.author, update.status, row.id]
  );
  console.log(`\nPublished: [${row.id}] ${row.title}`);
  console.log(`  slug: ${update.slug}`);
  console.log(`  author: ${update.author}`);
  console.log(`  status: published`);
}

await db.end();
console.log("\nAll three posts published successfully.");
