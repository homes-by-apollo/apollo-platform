import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { verifyAdminToken } from "../routers/adminAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

const ADMIN_COOKIE = "apollo_admin_session";

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // First, try Manus OAuth session
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  // If no Manus OAuth session, try the custom Apollo admin cookie
  if (!user) {
    try {
      const adminToken = opts.req.cookies?.[ADMIN_COOKIE];
      if (adminToken) {
        const payload = await verifyAdminToken(adminToken);
        if (payload) {
          // Synthesize a User-like object with role=admin so adminProcedure passes
          user = {
            id: 0,
            openId: payload.email,
            name: payload.name,
            email: payload.email,
            avatarUrl: null,
            role: "admin",
            createdAt: new Date(),
          } as unknown as User;
        }
      }
    } catch {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
