/**
 * Creates the "Buyers Guide" audience list in Resend and prints the list ID.
 * Run once: node scripts/create-resend-buyers-guide-list.mjs
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  console.error("RESEND_API_KEY not set");
  process.exit(1);
}

// First, list existing audiences to check if it already exists
const listRes = await fetch("https://api.resend.com/audiences", {
  headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
});
const listData = await listRes.json();
console.log("Existing audiences:", JSON.stringify(listData, null, 2));

const existing = listData.data?.find((a) => a.name === "Buyers Guide");
if (existing) {
  console.log("Buyers Guide list already exists:", existing.id);
  process.exit(0);
}

// Create the audience
const createRes = await fetch("https://api.resend.com/audiences", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${RESEND_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ name: "Buyers Guide" }),
});
const createData = await createRes.json();
console.log("Created Buyers Guide audience:", JSON.stringify(createData, null, 2));
