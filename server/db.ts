import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ENV } from "./_core/env";
import {
  User,
  UserProfile,
  Follow,
  Portfolio,
  Asset,
  Transaction,
  Notification,
  MarketData,
  IUser
} from "./models";

let isConnected = false;
let memoryServer: MongoMemoryServer | null = null;

export async function getDb() {
  if (isConnected) return mongoose.connection;
  
  const uri = process.env.MONGODB_URI || ENV.databaseUrl;
  
  if (!uri) {
    console.warn("[Database] MongoDB connection string not found");
    if (!ENV.isProduction) {
      try {
        memoryServer = memoryServer ?? (await MongoMemoryServer.create());
        const db = await mongoose.connect(memoryServer.getUri());
        isConnected = db.connections[0].readyState === 1;
        console.log("[Database] Using in-memory MongoDB (dev)");
        return mongoose.connection;
      } catch (error) {
        console.warn("[Database] Failed to start in-memory MongoDB:", error);
        return null;
      }
    }
    return null;
  }

  try {
    const db = await mongoose.connect(uri);
    isConnected = db.connections[0].readyState === 1;
    console.log("[Database] Connected to MongoDB");
    return mongoose.connection;
  } catch (error) {
    console.warn("[Database] Failed to connect to MongoDB:", error);
    if (!ENV.isProduction) {
      try {
        memoryServer = memoryServer ?? (await MongoMemoryServer.create());
        const db = await mongoose.connect(memoryServer.getUri());
        isConnected = db.connections[0].readyState === 1;
        console.log("[Database] Using in-memory MongoDB (dev fallback)");
        return mongoose.connection;
      } catch (fallbackError) {
        console.warn("[Database] Failed to start in-memory MongoDB:", fallbackError);
        return null;
      }
    }
    return null;
  }
}

export async function upsertUser(user: Partial<IUser>): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  await getDb();

  try {
    const updateData: any = { ...user };
    
    if (user.openId === ENV.ownerOpenId && !user.role) {
      updateData.role = 'admin';
    }

    updateData.lastSignedIn = new Date();

    await User.findOneAndUpdate(
      { openId: user.openId },
      { $set: updateData },
      { upsert: true, new: true, runValidators: true }
    );
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  await getDb();
  return User.findOne({ openId }).lean();
}

// Portfolio queries
export async function getPortfoliosByUserId(userId: string) {
  await getDb();
  return Portfolio.find({ userId }).lean();
}

export async function getPortfolioWithAssets(portfolioId: string) {
  await getDb();
  const portfolio = await Portfolio.findById(portfolioId).lean();
  if (!portfolio) return null;
  
  const assets = await Asset.find({ portfolioId }).lean();
  return { ...portfolio, assets };
}

// Asset queries
export async function getAssetsByPortfolioId(portfolioId: string) {
  await getDb();
  return Asset.find({ portfolioId }).lean();
}

// Transaction queries
export async function getTransactionsByPortfolioId(portfolioId: string, limit = 50) {
  await getDb();
  return Transaction.find({ portfolioId })
    .sort({ transactionDate: -1 })
    .limit(limit)
    .lean();
}

// Social queries
export async function getUserFollowers(userId: string) {
  await getDb();
  return Follow.find({ followingId: userId }).lean();
}

export async function getUserFollowing(userId: string) {
  await getDb();
  return Follow.find({ followerId: userId }).lean();
}

export async function isUserFollowing(followerId: string, followingId: string) {
  await getDb();
  const follow = await Follow.findOne({ followerId, followingId }).lean();
  return !!follow;
}

// Notification queries
export async function getUnreadNotifications(userId: string) {
  await getDb();
  return Notification.find({ userId, isRead: false }).lean();
}

// User profile queries
export async function getUserProfile(userId: string) {
  await getDb();
  return UserProfile.findOne({ userId }).lean();
}

// Market data queries
export async function getMarketData(symbol: string) {
  await getDb();
  return MarketData.findOne({ symbol }).lean();
}

export async function getAllMarketData() {
  await getDb();
  return MarketData.find().lean();
}
