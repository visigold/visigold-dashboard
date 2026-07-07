import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  clients,
  scanEvents,
  reviewEvents,
  quizzes,
  quizQuestions,
  quizOptions,
  quizSessions,
  interactionLogs,
  monthlyReports,
  quizAnswers,
} from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";

// ─── Clients Router ───────────────────────────────────────────────────────────
const clientsRouter = router({
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(clients).orderBy(clients.name);
  }),
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db.select().from(clients).where(eq(clients.id, input.id)).limit(1);
      return result[0] ?? null;
    }),
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        industry: z.string().optional(),
        city: z.string().optional(),
        googlePlaceId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.insert(clients).values(input);
      return { success: true };
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        industry: z.string().optional(),
        city: z.string().optional(),
        googlePlaceId: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
        privacyPolicyUrl: z.string().optional(),
        leadCollectionEnabled: z.boolean().optional(),
        consentText: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { id, ...data } = input;
      await db.update(clients).set(data).where(eq(clients.id, id));
      return { success: true };
    }),
});

// ─── Dashboard Router ─────────────────────────────────────────────────────────
const dashboardRouter = router({
  stats: publicProcedure
    .input(z.object({ clientId: z.number(), month: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const currentMonth = input.month ?? new Date().toISOString().slice(0, 7);

      if (!db) {
        return {
          totalScans: 0,
          totalReviews: 0,
          avgRating: "0.0",
          completionRate: 0,
          scanTraffic: [],
          scansBySource: [],
        };
      }

      const scanTraffic = await db
        .select({
          month: scanEvents.month,
          count: sql<number>`count(*)`,
        })
        .from(scanEvents)
        .where(eq(scanEvents.clientId, input.clientId))
        .groupBy(scanEvents.month)
        .orderBy(scanEvents.month)
        .limit(7);

      // Ajouter le tracking par source (emplacement)
      const scansBySource = await db
        .select({
          source: scanEvents.source,
          count: sql<number>`count(*)`,
        })
        .from(scanEvents)
        .where(and(eq(scanEvents.clientId, input.clientId), eq(scanEvents.month, currentMonth)))
        .groupBy(scanEvents.source)
        .orderBy(desc(sql<number>`count(*)`));

      const reviewsThisMonth = await db
        .select({
          count: sql<number>`count(*)`,
          avgRating: sql<number>`avg(rating)`,
        })
        .from(reviewEvents)
        .where(and(eq(reviewEvents.clientId, input.clientId), eq(reviewEvents.month, currentMonth)));

      const quizStats = await db
        .select({
          total: sql<number>`count(*)`,
          completed: sql<number>`sum(case when completed = 1 then 1 else 0 end)`,
        })
        .from(quizSessions)
        .where(and(eq(quizSessions.clientId, input.clientId), eq(quizSessions.month, currentMonth)));

      const totalScans = scanTraffic.reduce((sum: number, s: { count: number }) => sum + Number(s.count), 0);
      const totalReviews = Number(reviewsThisMonth[0]?.count ?? 0);
      const avgRating = Number(reviewsThisMonth[0]?.avgRating ?? 0);
      const quizTotal = Number(quizStats[0]?.total ?? 0);
      const quizCompleted = Number(quizStats[0]?.completed ?? 0);
      const completionRate = quizTotal > 0 ? Math.round((quizCompleted / quizTotal) * 100) : 0;

      return {
        totalScans,
        totalReviews,
        avgRating: avgRating.toFixed(1),
        completionRate,
        scanTraffic: scanTraffic.map((s: { month: string; count: number }) => ({
          month: s.month,
          scans: Number(s.count),
        })),
        scansBySource: scansBySource.map((s: { source: string | null; count: number }) => ({
          source: s.source || "Non spécifié",
          count: Number(s.count),
        })),
      };
    }),
});

// ─── Quiz Router ──────────────────────────────────────────────────────────────
const quizRouter = router({
  getActive: publicProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const quiz = await db
        .select()
        .from(quizzes)
        .where(and(eq(quizzes.clientId, input.clientId), eq(quizzes.status, "active")))
        .limit(1);
      if (!quiz[0]) return null;

      const questions = await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, quiz[0].id))
        .orderBy(quizQuestions.position);

      const questionsWithOptions = await Promise.all(
        questions.map(async (q: typeof quizQuestions.$inferSelect) => {
          const options = await db
            .select()
            .from(quizOptions)
            .where(eq(quizOptions.questionId, q.id))
            .orderBy(quizOptions.position);
          return { ...q, options };
        })
      );

      return { ...quiz[0], questions: questionsWithOptions };
    }),

  updateQuestion: publicProcedure
    .input(
      z.object({
        questionId: z.number(),
        questionText: z.string().min(1),
        options: z.array(
          z.object({
            id: z.number(),
            label: z.string().min(1),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(quizQuestions)
        .set({ questionText: input.questionText })
        .where(eq(quizQuestions.id, input.questionId));

      for (const opt of input.options) {
        await db
          .update(quizOptions)
          .set({ label: opt.label })
          .where(eq(quizOptions.id, opt.id));
      }
      return { success: true };
    }),
});

// ─── Logs Router ──────────────────────────────────────────────────────────────
const logsRouter = router({
  list: publicProcedure
    .input(z.object({ clientId: z.number(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(interactionLogs)
        .where(eq(interactionLogs.clientId, input.clientId))
        .orderBy(desc(interactionLogs.createdAt))
        .limit(input.limit);
    }),
});

// ─── Reports Router ───────────────────────────────────────────────────────────
const reportsRouter = router({
  list: publicProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(monthlyReports)
        .where(eq(monthlyReports.clientId, input.clientId))
        .orderBy(desc(monthlyReports.month));
    }),
  generate: publicProcedure
    .input(z.object({ clientId: z.number(), month: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const scans = await db
        .select({ count: sql<number>`count(*)` })
        .from(scanEvents)
        .where(and(eq(scanEvents.clientId, input.clientId), eq(scanEvents.month, input.month)));

      const reviews = await db
        .select({ count: sql<number>`count(*)`, avg: sql<number>`avg(rating)` })
        .from(reviewEvents)
        .where(and(eq(reviewEvents.clientId, input.clientId), eq(reviewEvents.month, input.month)));

      const sessions = await db
        .select({
          total: sql<number>`count(*)`,
          completed: sql<number>`sum(case when completed = 1 then 1 else 0 end)`,
        })
        .from(quizSessions)
        .where(and(eq(quizSessions.clientId, input.clientId), eq(quizSessions.month, input.month)));

      const totalScans = Number(scans[0]?.count ?? 0);
      const totalReviews = Number(reviews[0]?.count ?? 0);
      const avgRating = Number(reviews[0]?.avg ?? 0);
      const quizTotal = Number(sessions[0]?.total ?? 0);
      const quizCompleted = Number(sessions[0]?.completed ?? 0);
      const completionRate = quizTotal > 0 ? (quizCompleted / quizTotal) * 100 : 0;

      const existing = await db
        .select()
        .from(monthlyReports)
        .where(and(eq(monthlyReports.clientId, input.clientId), eq(monthlyReports.month, input.month)))
        .limit(1);

      const reportData = {
        totalScans,
        totalReviews,
        avgRating: String(avgRating.toFixed(1)) as unknown as typeof monthlyReports.$inferInsert.avgRating,
        quizCompletionRate: String(completionRate.toFixed(2)) as unknown as typeof monthlyReports.$inferInsert.quizCompletionRate,
        generatedAt: new Date(),
      };

      if (existing[0]) {
        await db.update(monthlyReports).set(reportData).where(eq(monthlyReports.id, existing[0].id));
      } else {
        await db.insert(monthlyReports).values({
          clientId: input.clientId,
          month: input.month,
          ...reportData,
        });
      }

      return { success: true, totalScans, totalReviews, avgRating, completionRate };
    }),
});

// ─── Quiz Answers Router ────────────────────────────────────────────────────────────
const quizAnswersRouter = router({
  results: publicProcedure
    .input(z.object({ clientId: z.number(), month: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const month = input.month ?? new Date().toISOString().slice(0, 7);
      const answers = await db
        .select({
          optionLabel: quizAnswers.optionLabel,
          count: sql<number>`count(*)`,
        })
        .from(quizAnswers)
        .where(and(eq(quizAnswers.clientId, input.clientId), eq(quizAnswers.month, month)))
        .groupBy(quizAnswers.optionLabel)
        .orderBy(desc(sql<number>`count(*)`));
      return answers.map((a: { optionLabel: string; count: number }) => ({
        label: a.optionLabel,
        count: Number(a.count),
      }));
    }),
});

// ─── App Router ────────────────────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  clients: clientsRouter,
  dashboard: dashboardRouter,
  quiz: quizRouter,
  quizAnswers: quizAnswersRouter,
  logs: logsRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
