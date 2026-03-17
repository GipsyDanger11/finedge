import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, portfolios, assets, transactions, follows, notifications, userProfiles, marketData } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Portfolio queries
export async function getPortfoliosByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolios).where(eq(portfolios.userId, userId));
}

export async function getPortfolioWithAssets(portfolioId: number) {
  const db = await getDb();
  if (!db) return null;
  const portfolio = await db.select().from(portfolios).where(eq(portfolios.id, portfolioId)).limit(1);
  if (!portfolio.length) return null;
  const assetList = await db.select().from(assets).where(eq(assets.portfolioId, portfolioId));
  return { ...portfolio[0], assets: assetList };
}

// Asset queries
export async function getAssetsByPortfolioId(portfolioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assets).where(eq(assets.portfolioId, portfolioId));
}

// Transaction queries
export async function getTransactionsByPortfolioId(portfolioId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transactions).where(eq(transactions.portfolioId, portfolioId)).limit(limit);
}

// Social queries
export async function getUserFollowers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(follows).where(eq(follows.followingId, userId));
}

export async function getUserFollowing(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(follows).where(eq(follows.followerId, userId));
}

export async function isUserFollowing(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(follows).where(
    and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
  ).limit(1);
  return result.length > 0;
}

// Notification queries
export async function getUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(
    and(eq(notifications.userId, userId), eq(notifications.isRead, false))
  );
}

// User profile queries
export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// Market data queries
export async function getMarketData(symbol: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(marketData).where(eq(marketData.symbol, symbol)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllMarketData() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketData);
}
