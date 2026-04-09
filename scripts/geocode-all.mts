/**
 * One-time geocoding script — run with: npx tsx scripts/geocode-all.mts
 * Geocodes all properties missing lat/lng using the Maps proxy.
 */
import "dotenv/config";
import mysql2 from "mysql2/promise";
import { makeRequest } from "../server/_core/map";

const conn = await mysql2.createConnection(process.env.DATABASE_URL!);

const [rows] = await conn.execute<any[]>(
  "SELECT id, address, city, state FROM properties WHERE lat IS NULL OR lng IS NULL"
);

console.log(`Ungeocoded listings: ${rows.length}`);

let ok = 0;
let fail = 0;

for (const row of rows) {
  const addr = [row.address, row.city, row.state].filter(Boolean).join(", ");
  try {
    const result = await makeRequest<any>("/maps/api/geocode/json", { address: addr });
    if (result.status === "OK" && result.results?.length > 0) {
      const loc = result.results[0].geometry.location;
      await conn.execute("UPDATE properties SET lat=?, lng=? WHERE id=?", [loc.lat, loc.lng, row.id]);
      console.log(`✓  ${addr}  →  ${loc.lat}, ${loc.lng}`);
      ok++;
    } else {
      console.log(`✗  ${addr}  →  ${result.status}`);
      fail++;
    }
  } catch (e: any) {
    console.log(`✗  ${addr}  →  ${e.message}`);
    fail++;
  }
}

await conn.end();
console.log(`\nDone: ${ok} succeeded, ${fail} failed`);
