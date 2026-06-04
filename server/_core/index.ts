import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // ─── Route publique QR Code ─────────────────────────────────────────────────
  // URL à encoder dans les QR codes : /scan/:clientSlug?source=comptoir&redirect=1
  app.get("/scan/:clientSlug", async (req, res) => {
    try {
      const { clientSlug } = req.params;
      const source = (req.query.source as string) || "qr_code";
      const currentMonth = new Date().toISOString().slice(0, 7);

      const { getDb } = await import("../db");
      const { scanEvents, clients, interactionLogs } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const db = await getDb();
      if (db) {
        // Trouver le client par slug
        const clientResult = await db.select().from(clients).where(eq(clients.slug, clientSlug)).limit(1);
        if (clientResult[0]) {
          const clientId = clientResult[0].id;
          // Enregistrer le scan
          await db.insert(scanEvents).values({
            clientId,
            source,
            anonymousId: `anon-${Date.now()}`,
            month: currentMonth,
          });
          // Log anonymisé
          await db.insert(interactionLogs).values({
            clientId,
            eventType: "scan",
            message: `via ${source}`,
            metadata: JSON.stringify({ source }),
          });
          // Rediriger vers Google Reviews si googlePlaceId défini
          const googlePlaceId = clientResult[0].googlePlaceId;
          if (googlePlaceId) {
            return res.redirect(`https://search.google.com/local/writereview?placeid=${googlePlaceId}`);
          }
        }
      }
      // Fallback : page de confirmation simple
      res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Merci !</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8f9fa}.box{text-align:center;padding:2rem;background:white;border-radius:1rem;box-shadow:0 4px 24px rgba(0,0,0,.08)}.logo{font-size:1.5rem;font-weight:bold;margin-bottom:1rem}.visi{color:#1a3a6b}.gold{color:#f26522}</style></head><body><div class="box"><div class="logo"><span class="visi">VISI</span><span class="gold">GOLD</span></div><p>Merci pour votre visite !</p><p style="color:#888;font-size:.9rem">Votre avis a bien été enregistré.</p></div></body></html>`);
    } catch (err) {
      console.error("[QR Scan] Error:", err);
      res.status(500).send("Erreur lors de l'enregistrement du scan.");
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
