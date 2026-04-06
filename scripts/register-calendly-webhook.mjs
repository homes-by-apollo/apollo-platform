/**
 * register-calendly-webhook.mjs
 * Registers the Apollo SCOPS webhook with Calendly API
 * Usage: node scripts/register-calendly-webhook.mjs
 */

const CALENDLY_API_KEY = process.env.CALENDLY_API_KEY;
if (!CALENDLY_API_KEY) {
  console.error("CALENDLY_API_KEY not found in .env");
  process.exit(1);
}

const WEBHOOK_URL = "https://apollohomebuilders.com/api/webhooks/calendly";
const EVENTS = ["invitee.created", "invitee.canceled"];

async function main() {
  // 1. Get current user
  const meRes = await fetch("https://api.calendly.com/users/me", {
    headers: { Authorization: `Bearer ${CALENDLY_API_KEY}` },
  });
  const meData = await meRes.json();
  const userUri = meData.resource?.uri;
  const orgUri = meData.resource?.current_organization;
  console.log("User URI:", userUri);
  console.log("Org URI:", orgUri);

  if (!userUri || !orgUri) {
    console.error("Could not get user/org URI");
    process.exit(1);
  }

  // 2. List existing webhooks to avoid duplicates
  const listRes = await fetch(
    `https://api.calendly.com/webhook_subscriptions?organization=${encodeURIComponent(orgUri)}&scope=organization`,
    { headers: { Authorization: `Bearer ${CALENDLY_API_KEY}` } }
  );
  const listData = await listRes.json();
  const existing = listData.collection ?? [];
  console.log("\nExisting webhooks:");
  for (const wh of existing) {
    console.log(`  - ${wh.callback_url} [${wh.events?.join(", ")}] state=${wh.state}`);
  }

  // 3. Check if our webhook already exists
  const alreadyRegistered = existing.some(
    (wh) => wh.callback_url === WEBHOOK_URL && wh.state === "active"
  );

  if (alreadyRegistered) {
    console.log("\n✅ Webhook already registered and active. No action needed.");
    return;
  }

  // 4. Register the webhook
  console.log("\nRegistering webhook...");
  const createRes = await fetch("https://api.calendly.com/webhook_subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CALENDLY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      events: EVENTS,
      organization: orgUri,
      user: userUri,
      scope: "user",
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok) {
    console.error("Failed to register webhook:", JSON.stringify(createData, null, 2));
    process.exit(1);
  }

  console.log("✅ Webhook registered successfully:");
  console.log(`  URL: ${createData.resource?.callback_url}`);
  console.log(`  Events: ${createData.resource?.events?.join(", ")}`);
  console.log(`  State: ${createData.resource?.state}`);
  console.log(`  URI: ${createData.resource?.uri}`);
}

main().catch(console.error);
