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
      let clientName = "notre établissement";
      if (db) {
        // Trouver le client par slug
        const clientResult = await db.select().from(clients).where(eq(clients.slug, clientSlug)).limit(1);
        if (clientResult[0]) {
          clientName = clientResult[0].name;
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
      // Page de remerciement personnalisée
      res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Merci !</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; background: linear-gradient(135deg, #1a3a6b 0%, #0f2347 100%); display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .card { background: white; border-radius: 1.5rem; padding: 2.5rem 2rem; max-width: 380px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,.3); }
    .logo { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 0.25rem; }
    .visi { color: #1a3a6b; } .gold { color: #f26522; }
    .check { width: 64px; height: 64px; background: #f0fdf4; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 1.5rem auto 1rem; }
    .check svg { width: 32px; height: 32px; }
    h1 { font-size: 1.25rem; font-weight: 700; color: #1a3a6b; margin-bottom: 0.5rem; }
    .subtitle { color: #6b7280; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem; }
    .client-name { font-weight: 600; color: #f26522; }
    .stars { font-size: 1.5rem; letter-spacing: 2px; margin-bottom: 1rem; }
    .footer { font-size: 0.7rem; color: #d1d5db; margin-top: 1.5rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo"><span class="visi">VISI</span><span class="gold">GOLD</span></div>
    <div class="check">
      <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
    <div class="stars">⭐⭐⭐⭐⭐</div>
    <h1>Merci pour votre visite !</h1>
    <p class="subtitle">Votre passage chez <span class="client-name">${clientName}</span> a été enregistré.<br>Votre avis compte beaucoup pour nous.</p>
    <p class="footer">© ${new Date().getFullYear()} Visigold — Gestion de réputation locale</p>
  </div>
</body>
</html>`);
    } catch (err) {
      console.error("[QR Scan] Error:", err);
      res.status(500).send("Erreur lors de l'enregistrement du scan.");
    }
  });

  // tRPC API
  // Route de tracking quiz public
  app.post("/api/quiz-track", async (req, res) => {
    try {
      const { clientSlug, event, source, score, total, channel, questionNum, isCorrect } = req.body || {};
      if (!clientSlug || !event) return res.json({ ok: false });
      const { getDb } = await import("../db");
      const { clients, interactionLogs, quizSessions } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (db) {
        const clientResult = await db.select().from(clients).where(eq(clients.slug, clientSlug)).limit(1);
        if (clientResult[0]) {
          const clientId = clientResult[0].id;
          const month = new Date().toISOString().slice(0, 7);
          await db.insert(interactionLogs).values({
            clientId,
            eventType: event === 'share' ? 'quiz_share' : event === 'complete' ? 'quiz_completed' : 'quiz_answer',
            message: event === 'share' ? `via ${channel}` : event === 'complete' ? `score ${score}/${total}` : `Q${questionNum} ${isCorrect ? 'correct' : 'wrong'}`,
            metadata: JSON.stringify({ source, event, channel, score, total, questionNum, isCorrect }),
          });
          if (event === 'complete') {
            await db.insert(quizSessions).values({ clientId, quizId: 0, completed: true, month });
          }
        }
      }
      res.json({ ok: true });
    } catch (e) {
      res.json({ ok: false });
    }
  });

  // Route de session pour l'authentification par mot de passe
  app.post("/api/session", (req, res) => {
    const { token } = req.body || {};
    if (token === "authenticated") {
      res.cookie("visigold_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false });
    }
  });

  app.delete("/api/session", (_req, res) => {
    res.clearCookie("visigold_session");
    res.json({ success: true });
  });

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
