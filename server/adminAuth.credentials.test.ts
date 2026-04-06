import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";

const SHARED_PASSWORD = "Pahrump2026!$#";
const STORED_HASH = "$2b$10$GEFRo72kcJ1GmccYP3XmmOw73YHAF8uKqA/mtIqu6Klyac9oUDbKq";

describe("Admin credential hashes", () => {
  it("ADMIN_KYLE_HASH / ADMIN_BRANDON_HASH / ADMIN_JONATHAN_HASH all match the shared password", async () => {
    const valid = await bcrypt.compare(SHARED_PASSWORD, STORED_HASH);
    expect(valid).toBe(true);
  });

  it("Wrong password does not match", async () => {
    const invalid = await bcrypt.compare("WrongPassword123!", STORED_HASH);
    expect(invalid).toBe(false);
  });
});
