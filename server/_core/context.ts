import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// Utilisateur admin fictif pour l'authentification par mot de passe dashboard
const DASHBOARD_ADMIN_USER: User = {
  id: 1,
  openId: "visigold-admin",
  name: "Visigold Admin",
  email: "contact@visigold.ch",
  loginMethod: "password",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Vérifier l'authentification par header ou cookie
  const authHeader = opts.req.headers["x-visigold-auth"];
  const cookieHeader = opts.req.headers.cookie || "";
  const sessionCookie = cookieHeader.split(";").find(c => c.trim().startsWith("visigold_session="))?.split("=")[1]?.trim();

  if (authHeader === "authenticated" || sessionCookie === "authenticated") {
    user = DASHBOARD_ADMIN_USER;
  } else {
    // Fallback: essayer l'authentification OAuth Manus
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
