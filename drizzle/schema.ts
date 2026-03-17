import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index, foreignKey, json } from "drizzle-orm/mysql-core";


/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ([
  index("idx_openId").on(table.openId),
]));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// User profiles and social features
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  portfolioVisibility: mysqlEnum("portfolioVisibility", ["private", "public", "friends"]).default("private").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ([
  foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade"),
  index("idx_userId").on(table.userId),
]));

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

// Social: Following relationships
export const follows = mysqlTable("follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  followingId: int("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ([
  foreignKey({ columns: [table.followerId], foreignColumns: [users.id] }).onDelete("cascade"),
  foreignKey({ columns: [table.followingId], foreignColumns: [users.id] }).onDelete("cascade"),
  index("idx_followerId").on(table.followerId),
  index("idx_followingId").on(table.followingId),
]));

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;

// Portfolio management
export const portfolios = mysqlTable("portfolios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["live", "practice"]).default("live").notNull(),
  initialBalance: decimal("initialBalance", { precision: 15, scale: 2 }).notNull(),
  currentBalance: decimal("currentBalance", { precision: 15, scale: 2 }).notNull(),
  totalInvested: decimal("totalInvested", { precision: 15, scale: 2 }).default("0"),
  totalGain: decimal("totalGain", { precision: 15, scale: 2 }).default("0"),
  gainPercentage: decimal("gainPercentage", { precision: 10, scale: 2 }).default("0"),
  isPublic: boolean("isPublic").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ([
  foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade"),
  index("idx_userId").on(table.userId),
]));

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;

// Assets in portfolio
export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  assetType: mysqlEnum("assetType", ["stock", "crypto", "etf", "commodity", "bond"]).notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(),
  averageCost: decimal("averageCost", { precision: 15, scale: 2 }).notNull(),
  currentPrice: decimal("currentPrice", { precision: 15, scale: 2 }).notNull(),
  totalValue: decimal("totalValue", { precision: 15, scale: 2 }).notNull(),
  gainLoss: decimal("gainLoss", { precision: 15, scale: 2 }).default("0"),
  gainLossPercentage: decimal("gainLossPercentage", { precision: 10, scale: 2 }).default("0"),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ([
  foreignKey({ columns: [table.portfolioId], foreignColumns: [portfolios.id] }).onDelete("cascade"),
  index("idx_portfolioId").on(table.portfolioId),
  index("idx_symbol").on(table.symbol),
]));

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;

// Transaction history
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  assetId: int("assetId"),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  type: mysqlEnum("type", ["buy", "sell", "transfer"]).notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 15, scale: 2 }).default("0"),
  notes: text("notes"),
  transactionDate: timestamp("transactionDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ([
  foreignKey({ columns: [table.portfolioId], foreignColumns: [portfolios.id] }).onDelete("cascade"),
  foreignKey({ columns: [table.assetId], foreignColumns: [assets.id] }).onDelete("set null"),
  index("idx_portfolioId").on(table.portfolioId),
  index("idx_symbol").on(table.symbol),
  index("idx_transactionDate").on(table.transactionDate),
]));

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// Price alerts
export const priceAlerts = mysqlTable("priceAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  alertType: mysqlEnum("alertType", ["above", "below"]).notNull(),
  targetPrice: decimal("targetPrice", { precision: 15, scale: 2 }).notNull(),
  isActive: boolean("isActive").default(true),
  triggeredAt: timestamp("triggeredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ([
  foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade"),
  index("idx_userId").on(table.userId),
  index("idx_symbol").on(table.symbol),
]));

export type PriceAlert = typeof priceAlerts.$inferSelect;
export type InsertPriceAlert = typeof priceAlerts.$inferInsert;

// Notifications
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["price_alert", "milestone", "portfolio_update", "social", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedData: json("relatedData"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ([
  foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade"),
  index("idx_userId").on(table.userId),
  index("idx_isRead").on(table.isRead),
]));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// AI Insights cache
export const aiInsights = mysqlTable("aiInsights", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  insightType: mysqlEnum("insightType", ["risk_analysis", "recommendations", "market_summary", "diversification"]).notNull(),
  content: json("content").notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
}, (table) => ([
  foreignKey({ columns: [table.portfolioId], foreignColumns: [portfolios.id] }).onDelete("cascade"),
  index("idx_portfolioId").on(table.portfolioId),
]));

export type AIInsight = typeof aiInsights.$inferSelect;
export type InsertAIInsight = typeof aiInsights.$inferInsert;

// Market data cache for real-time prices
export const marketData = mysqlTable("marketData", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull().unique(),
  currentPrice: decimal("currentPrice", { precision: 15, scale: 2 }).notNull(),
  dayHigh: decimal("dayHigh", { precision: 15, scale: 2 }),
  dayLow: decimal("dayLow", { precision: 15, scale: 2 }),
  dayChange: decimal("dayChange", { precision: 10, scale: 2 }),
  dayChangePercent: decimal("dayChangePercent", { precision: 10, scale: 2 }),
  marketCap: decimal("marketCap", { precision: 20, scale: 2 }),
  volume: decimal("volume", { precision: 20, scale: 0 }),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
}, (table) => ([
  index("idx_symbol").on(table.symbol),
]));

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = typeof marketData.$inferInsert;