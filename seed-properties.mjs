/**
 * Bulk-insert all 35 live property and lot listings from pahrumpbuilder.com
 * Run with: node seed-properties.mjs
 *
 * Tag enum: "Available" | "Coming Soon" | "Sold" | "Under Contract"
 * "Under Construction" on live site → "Available" here (still for sale)
 */
import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const homes = [
  { address:"480 E Arapahoe St, Pahrump, NV 89048",    city:"Pahrump", state:"NV", tag:"Available",      beds:3,  baths:3, sqft:"1,800", garage:2, price:"$389,900", priceValue:389900, featured:1, sortOrder:1,  description:"3 bed / 2.5 bath all-inclusive new build. Under Construction." },
  { address:"461 Comstock Ave, Pahrump, NV 89048",      city:"Pahrump", state:"NV", tag:"Available",      beds:12, baths:8, sqft:"4,400", garage:0, price:"$749,900", priceValue:749900, featured:1, sortOrder:2,  description:"Large 12 bed / 8 bath multi-unit investment property. Under Construction." },
  { address:"4081 Jessica St, Pahrump, NV 89048",       city:"Pahrump", state:"NV", tag:"Available",      beds:3,  baths:3, sqft:"1,800", garage:2, price:"$409,900", priceValue:409900, featured:1, sortOrder:3,  description:"3 bed / 2.5 bath new build. Under Construction." },
  { address:"5691 N Alderwood Place, Pahrump, NV 89048",city:"Pahrump", state:"NV", tag:"Available",      beds:3,  baths:2, sqft:"1,466", garage:2, price:"$329,900", priceValue:329900, featured:0, sortOrder:4,  description:"3 bed / 2 bath new build on Alderwood Place. Under Construction." },
  { address:"1100 Hall Ave, Pahrump, NV 89048",         city:"Pahrump", state:"NV", tag:"Available",      beds:12, baths:8, sqft:"4,400", garage:0, price:"$749,900", priceValue:749900, featured:0, sortOrder:5,  description:"Large 12 bed / 8 bath multi-unit investment property. Under Construction." },
  { address:"1060 Hall Ave, Pahrump, NV 89048",         city:"Pahrump", state:"NV", tag:"Available",      beds:12, baths:8, sqft:"4,400", garage:0, price:"$749,900", priceValue:749900, featured:0, sortOrder:6,  description:"Large 12 bed / 8 bath multi-unit investment property. Under Construction." },
  { address:"5681 Alderwood Place, Pahrump, NV 89048",  city:"Pahrump", state:"NV", tag:"Available",      beds:3,  baths:2, sqft:"1,823", garage:2, price:"$369,900", priceValue:369900, featured:0, sortOrder:7,  description:"3 bed / 2 bath new build on Alderwood Place. Under Construction." },
  { address:"4951 W Windsong Lane, Pahrump, NV 89048",  city:"Pahrump", state:"NV", tag:"Available",      beds:3,  baths:3, sqft:"1,800", garage:4, price:"$429,900", priceValue:429900, featured:0, sortOrder:8,  description:"3 bed / 2.5 bath with 4-car garage on Windsong Lane. Under Construction." },
  { address:"4670 Medicine Man, Pahrump, NV 89048",     city:"Pahrump", state:"NV", tag:"Available",      beds:3,  baths:2, sqft:"1,600", garage:2, price:"$369,900", priceValue:369900, featured:0, sortOrder:9,  description:"3 bed / 2 bath new build on Medicine Man. Under Construction." },
  { address:"1370 Tiptop Trail, Pahrump, NV 89048",     city:"Pahrump", state:"NV", tag:"Available",      beds:3,  baths:3, sqft:"1,972", garage:2, price:"$479,900", priceValue:479900, featured:0, sortOrder:10, description:"3 bed / 2.5 bath new build on Tiptop Trail. Under Construction." },
  { address:"281 Chevron St, Pahrump, NV 89048",        city:"Pahrump", state:"NV", tag:"Available",      beds:3,  baths:3, sqft:"1,800", garage:2, price:"$389,900", priceValue:389900, featured:0, sortOrder:11, description:"3 bed / 2.5 bath new build on Chevron St. Under Construction." },
  { address:"2886 Mount Charleston Dr, Pahrump, NV 89048",city:"Pahrump",state:"NV",tag:"Available",      beds:3,  baths:2, sqft:"1,466", garage:2, price:"$329,900", priceValue:329900, featured:0, sortOrder:12, description:"3 bed / 2 bath new build on Mount Charleston Dr. Under Construction." },
  { address:"3300 W Wilson Rd, Pahrump, NV 89048",      city:"Pahrump", state:"NV", tag:"Available",      beds:3,  baths:2, sqft:"1,466", garage:2, price:"$359,900", priceValue:359900, featured:0, sortOrder:13, description:"3 bed / 2 bath new build on Wilson Rd. Under Construction." },
  { address:"3824 Mount Charleston Dr, Pahrump, NV 89048",city:"Pahrump",state:"NV",tag:"Under Contract", beds:3,  baths:2, sqft:"1,466", garage:2, price:"$329,900", priceValue:329900, featured:0, sortOrder:14, description:"3 bed / 2 bath on Mount Charleston Dr. Under Contract." },
  { address:"3201 Prospector Ln, Pahrump, NV 89048",    city:"Pahrump", state:"NV", tag:"Available",      beds:3,  baths:2, sqft:"1,466", garage:2, price:"$349,900", priceValue:349900, featured:0, sortOrder:15, description:"3 bed / 2 bath new build on Prospector Ln. Under Construction." },
  { address:"181 Comstock Ave, Pahrump, NV 89048",      city:"Pahrump", state:"NV", tag:"Available",      beds:3,  baths:3, sqft:"1,800", garage:2, price:"$369,900", priceValue:369900, featured:0, sortOrder:16, description:"3 bed / 2.5 bath new build on Comstock Ave. Under Construction." },
  { address:"730 W Kimberly Ave, Pahrump, NV 89060",    city:"Pahrump", state:"NV", tag:"Available",      beds:3,  baths:2, sqft:"1,823", garage:3, price:"$419,900", priceValue:419900, featured:0, sortOrder:17, description:"3 bed / 2 bath with 3-car garage on Kimberly Ave. Under Construction." },
  { address:"3750 S Pahrump Valley Blvd, Pahrump, NV 89048",city:"Pahrump",state:"NV",tag:"Available",   beds:4,  baths:2, sqft:"2,448", garage:3, price:"$489,900", priceValue:489900, featured:0, sortOrder:18, description:"4 bed / 2 bath with 3-car garage on Pahrump Valley Blvd. Under Construction." },
  { address:"1531 W Lost Creek Dr, Pahrump, NV 89048",  city:"Pahrump", state:"NV", tag:"Under Contract", beds:4,  baths:2, sqft:"1,773", garage:2, price:"$429,900", priceValue:429900, featured:0, sortOrder:19, description:"4 bed / 2 bath on Lost Creek Dr. Under Contract." },
  { address:"991 E Enchanted Mesa St, Pahrump, NV 89048",city:"Pahrump",state:"NV", tag:"Under Contract", beds:3,  baths:3, sqft:"1,800", garage:2, price:"$359,900", priceValue:359900, featured:0, sortOrder:20, description:"3 bed / 2.5 bath on Enchanted Mesa St. Under Contract." },
];

const lots = [
  { address:"1130 Annie Ave, Pahrump, NV 89060",              city:"Pahrump", state:"NV", lotSize:"0.33 Acres", sortOrder:1,  description:"North Side Custom Home Area. Large 1/3 Acre Lot with water and sewer." },
  { address:"5380 N Fleetwood Place, Pahrump, NV 89060",      city:"Pahrump", state:"NV", lotSize:"0.33 Acres", sortOrder:2,  description:"North Side custom home neighborhood." },
  { address:"3941 S Money St, Pahrump, NV 89048",             city:"Pahrump", state:"NV", lotSize:"1.32 Acres", sortOrder:3,  description:"Oversized 1.32 Acre South Side Lot. Excellent location with easy access." },
  { address:"1451 Pioche St, Pahrump, NV 89048",              city:"Pahrump", state:"NV", lotSize:"1.1 Acres",  sortOrder:4,  description:"1 Acre South Side Lot with water rights already allocated. Quick start construction possible." },
  { address:"3720 Tahachapi Ave, Pahrump, NV 89048",          city:"Pahrump", state:"NV", lotSize:"1.1 Acres",  sortOrder:5,  description:"Premium 1 Acre Lot with Well and Septic." },
  { address:"3860 Seneca Ave, Pahrump, NV 89048",             city:"Pahrump", state:"NV", lotSize:"1.14 Acres", sortOrder:6,  description:"South Side Premium 1 Acre lot for Well and Septic." },
  { address:"2831 E Deerskin St, Pahrump, NV 89048",          city:"Pahrump", state:"NV", lotSize:"1.1 Acres",  sortOrder:7,  description:"Premium 1 Acre Well and Septic Lot near Hwy 160." },
  { address:"3110 Tahachapi Ave, Pahrump, NV 89048",          city:"Pahrump", state:"NV", lotSize:"1.14 Acres", sortOrder:8,  description:"Premium South Side 1 Acre, Water and Septic (No Well)." },
  { address:"1330 Silver Peak Ave, Pahrump, NV 89048",        city:"Pahrump", state:"NV", lotSize:"1.1 Acres",  sortOrder:9,  description:"Premium 1 Acre North of Calvada, South of Hwy 372." },
  { address:"3270 Ness St, Pahrump, NV 89048",                city:"Pahrump", state:"NV", lotSize:"2.09 Acres", sortOrder:10, description:"Premium 2+ Acre Lot in the South West." },
  { address:"2651 Quinta Ave, Pahrump, NV 89048",             city:"Pahrump", state:"NV", lotSize:"1.14 Acres", sortOrder:11, description:"Premium 1 Acre South Side Lot." },
  { address:"1991 S Highland Ave, Pahrump, NV 89048",         city:"Pahrump", state:"NV", lotSize:"0.20 Acres", sortOrder:12, description:"South Side Quarter Acre." },
  { address:"3260 Shadow Mountain St, Pahrump, NV 89060",     city:"Pahrump", state:"NV", lotSize:"0.90 Acres", sortOrder:13, description:"North Side 1 Acre Lot." },
  { address:"3420 Pueblo Rd, Pahrump, NV 89048",              city:"Pahrump", state:"NV", lotSize:"0.93 Acres", sortOrder:14, description:"1 Acre North Side Lot." },
  { address:"111 Fairway St, Pahrump, NV 89048",              city:"Pahrump", state:"NV", lotSize:"0.26 Acres", sortOrder:15, description:"South Side Quarter Acre." },
];

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  console.log("✓ Connected to database.");

  // Clear existing seeded data to avoid duplicates on re-run
  await conn.execute("DELETE FROM properties WHERE address LIKE '%, Pahrump, NV%'");
  console.log("✓ Cleared existing Pahrump listings.");

  // Insert homes
  console.log(`\nInserting ${homes.length} home listings...`);
  for (const h of homes) {
    await conn.execute(
      `INSERT INTO properties
        (propertyType, tag, address, city, state, price, priceValue, beds, baths, sqft, lotSize, featured, sortOrder, description, imageUrl, imageUrls, utilities, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, NULL, NULL, NULL, NOW(), NOW())`,
      ["HOME", h.tag, h.address, h.city, h.state, h.price, h.priceValue, h.beds, h.baths, h.sqft, h.featured, h.sortOrder, h.description]
    );
    console.log(`  ✓ ${h.address}`);
  }

  // Insert lots
  console.log(`\nInserting ${lots.length} lot listings...`);
  for (const l of lots) {
    await conn.execute(
      `INSERT INTO properties
        (propertyType, tag, address, city, state, price, priceValue, beds, baths, sqft, lotSize, featured, sortOrder, description, imageUrl, imageUrls, utilities, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?, 0, ?, ?, NULL, NULL, NULL, NOW(), NOW())`,
      ["LOT", "Available", l.address, l.city, l.state, "Inquire", l.lotSize, l.sortOrder, l.description]
    );
    console.log(`  ✓ ${l.address}`);
  }

  await conn.end();
  console.log(`\n✅ Done! Inserted ${homes.length} homes + ${lots.length} lots = ${homes.length + lots.length} total listings.`);
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
