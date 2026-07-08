import * as bcrypt from "bcrypt";
import { getDb } from "../db";
import { clients } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const SALT_ROUNDS = 10;

/**
 * Hash un mot de passe pour stockage sécurisé
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Vérifie qu'un mot de passe correspond à son hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Authentifie un client avec son nom d'utilisateur et mot de passe
 */
export async function authenticateClient(
  username: string,
  password: string
): Promise<{ success: boolean; clientId?: number; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database unavailable" };
  }

  // Chercher le client par nom d'utilisateur
  const result = await db
    .select()
    .from(clients)
    .where(eq(clients.clientUsername, username))
    .limit(1);

  const client = result[0];

  if (!client) {
    return { success: false, error: "Invalid username or password" };
  }

  if (!client.clientAccessEnabled) {
    return { success: false, error: "Client access is disabled" };
  }

  if (!client.clientPassword) {
    return { success: false, error: "Client password not configured" };
  }

  // Vérifier le mot de passe
  const passwordMatch = await verifyPassword(password, client.clientPassword);

  if (!passwordMatch) {
    return { success: false, error: "Invalid username or password" };
  }

  return { success: true, clientId: client.id };
}

/**
 * Crée ou met à jour les credentials d'un client
 */
export async function setClientCredentials(
  clientId: number,
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database unavailable" };
  }

  // Vérifier que le nom d'utilisateur n'existe pas déjà (sauf pour ce client)
  const existing = await db
    .select()
    .from(clients)
    .where(eq(clients.clientUsername, username))
    .limit(1);

  if (existing[0] && existing[0].id !== clientId) {
    return { success: false, error: "Username already in use" };
  }

  const hashedPassword = await hashPassword(password);

  await db
    .update(clients)
    .set({
      clientUsername: username,
      clientPassword: hashedPassword,
      clientAccessEnabled: true,
    })
    .where(eq(clients.id, clientId));

  return { success: true };
}

/**
 * Désactive l'accès client pour un client donné
 */
export async function disableClientAccess(clientId: number): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database unavailable" };
  }

  await db
    .update(clients)
    .set({ clientAccessEnabled: false })
    .where(eq(clients.id, clientId));

  return { success: true };
}
