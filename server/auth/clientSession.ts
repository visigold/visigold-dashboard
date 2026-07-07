import * as jwt from "jsonwebtoken";
import { Request, Response } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRY = "7d";

export interface ClientJWTPayload {
  clientId: number;
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * Génère un JWT pour un client
 */
export function generateClientToken(clientId: number, username: string): string {
  return jwt.sign({ clientId, username }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Vérifie et décode un JWT client
 */
export function verifyClientToken(token: string): ClientJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ClientJWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extrait le token JWT du header Authorization
 */
export function extractTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Middleware pour vérifier l'authentification client
 */
export function clientAuthMiddleware(req: Request, res: Response, next: () => void) {
  const token = extractTokenFromHeader(req);

  if (!token) {
    (req as any).clientAuth = null;
    return next();
  }

  const payload = verifyClientToken(token);
  if (!payload) {
    (req as any).clientAuth = null;
    return next();
  }

  (req as any).clientAuth = payload;
  next();
}

/**
 * Middleware pour exiger l'authentification client
 */
export function requireClientAuth(req: Request, res: Response, next: () => void) {
  const clientAuth = (req as any).clientAuth;

  if (!clientAuth) {
    res.status(401).json({ error: "Unauthorized: Client authentication required" });
    return;
  }

  next();
}
