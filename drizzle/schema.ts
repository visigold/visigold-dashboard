import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Clients ──────────────────────────────────────────────────────────────────
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  industry: varchar("industry", { length: 100 }),
  city: varchar("city", { length: 100 }),
  googlePlaceId: varchar("googlePlaceId", { length: 255 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ─── Scan Events ──────────────────────────────────────────────────────────────
export const scanEvents = mysqlTable("scan_events", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  source: varchar("source", { length: 100 }).default("qr_code"),
  anonymousId: varchar("anonymousId", { length: 64 }),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScanEvent = typeof scanEvents.$inferSelect;
export type InsertScanEvent = typeof scanEvents.$inferInsert;

// ─── Review Events ────────────────────────────────────────────────────────────
export const reviewEvents = mysqlTable("review_events", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }),
  platform: varchar("platform", { length: 50 }).default("google"),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReviewEvent = typeof reviewEvents.$inferSelect;
export type InsertReviewEvent = typeof reviewEvents.$inferInsert;

// ─── Quizzes ──────────────────────────────────────────────────────────────────
export const quizzes = mysqlTable("quizzes", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "draft", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

// ─── Quiz Questions ───────────────────────────────────────────────────────────
export const quizQuestions = mysqlTable("quiz_questions", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  questionText: text("questionText").notNull(),
  position: int("position").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;

// ─── Quiz Options ─────────────────────────────────────────────────────────────
export const quizOptions = mysqlTable("quiz_options", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  value: varchar("value", { length: 100 }).notNull(),
  position: int("position").default(1).notNull(),
});

export type QuizOption = typeof quizOptions.$inferSelect;
export type InsertQuizOption = typeof quizOptions.$inferInsert;

// ─── Quiz Sessions ────────────────────────────────────────────────────────────
export const quizSessions = mysqlTable("quiz_sessions", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  quizId: int("quizId").notNull(),
  completed: boolean("completed").default(false).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizSession = typeof quizSessions.$inferSelect;
export type InsertQuizSession = typeof quizSessions.$inferInsert;

// ─── Interaction Logs ─────────────────────────────────────────────────────────
export const interactionLogs = mysqlTable("interaction_logs", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  message: varchar("message", { length: 500 }).notNull(),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InteractionLog = typeof interactionLogs.$inferSelect;
export type InsertInteractionLog = typeof interactionLogs.$inferInsert;

// ─── Monthly Reports ──────────────────────────────────────────────────────────
export const monthlyReports = mysqlTable("monthly_reports", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM
  totalScans: int("totalScans").default(0).notNull(),
  totalReviews: int("totalReviews").default(0).notNull(),
  avgRating: decimal("avgRating", { precision: 2, scale: 1 }),
  quizCompletionRate: decimal("quizCompletionRate", { precision: 5, scale: 2 }),
  pdfUrl: text("pdfUrl"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export type MonthlyReport = typeof monthlyReports.$inferSelect;
export type InsertMonthlyReport = typeof monthlyReports.$inferInsert;

// ─── Quiz Answers ────────────────────────────────────────────────────────────────────────────────
export const quizAnswers = mysqlTable("quiz_answers", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  quizId: int("quizId").notNull(),
  questionId: int("questionId").notNull(),
  optionId: int("optionId").notNull(),
  optionLabel: varchar("optionLabel", { length: 255 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type InsertQuizAnswer = typeof quizAnswers.$inferInsert;
