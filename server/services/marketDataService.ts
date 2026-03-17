/**
 * Market Data Service
 * Handles real-time market data fetching and caching
 * In production, this would integrate with real market data APIs
 */

import { getDb } from "../db";
import { marketData, InsertMarketData, priceAlerts } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export interface MarketPrice {
  symbol: string;
  currentPrice: number;
  dayHigh?: number;
  dayLow?: number;
  dayChange?: number;
  dayChangePercent?: number;
  marketCap?: number;
  volume?: number;
}

/**
 * Fetch real-time market data for a symbol
 * In production, integrate with APIs like Alpha Vantage, Finnhub, or CoinGecko
 */
export async function fetchMarketPrice(symbol: string): Promise<MarketPrice | null> {
  try {
    // TODO: Replace with actual market data API integration
    // Example: Alpha Vantage, Finnhub, IEX Cloud, CoinGecko, etc.
    // For now, return mock data structure

    const mockData: MarketPrice = {
      symbol,
      currentPrice: 100 + Math.random() * 50,
      dayHigh: 105,
      dayLow: 95,
      dayChange: 2.5,
      dayChangePercent: 2.5,
      marketCap: 1000000000,
      volume: 5000000,
    };

    return mockData;
  } catch (error) {
    console.error(`[MarketData] Error fetching price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Update market data in database cache
 */
export async function updateMarketDataCache(data: MarketPrice): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const insertData: InsertMarketData = {
      symbol: data.symbol,
      currentPrice: data.currentPrice.toString(),
      dayHigh: data.dayHigh?.toString(),
      dayLow: data.dayLow?.toString(),
      dayChange: data.dayChange?.toString(),
      dayChangePercent: data.dayChangePercent?.toString(),
      marketCap: data.marketCap?.toString(),
      volume: data.volume?.toString(),
    };

    // Upsert: update if exists, insert if not
    await db
      .insert(marketData)
      .values(insertData)
      .onDuplicateKeyUpdate({
        set: {
          currentPrice: insertData.currentPrice,
          dayHigh: insertData.dayHigh,
          dayLow: insertData.dayLow,
          dayChange: insertData.dayChange,
          dayChangePercent: insertData.dayChangePercent,
          marketCap: insertData.marketCap,
          volume: insertData.volume,
        },
      });
  } catch (error) {
    console.error(`[MarketData] Error updating cache for ${data.symbol}:`, error);
  }
}

/**
 * Get cached market data from database
 */
export async function getCachedMarketData(symbol: string): Promise<MarketPrice | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(marketData).where(eq(marketData.symbol, symbol)).limit(1);

    if (result.length === 0) return null;

    const cached = result[0];
    return {
      symbol: cached.symbol,
      currentPrice: parseFloat(cached.currentPrice),
      dayHigh: cached.dayHigh ? parseFloat(cached.dayHigh) : undefined,
      dayLow: cached.dayLow ? parseFloat(cached.dayLow) : undefined,
      dayChange: cached.dayChange ? parseFloat(cached.dayChange) : undefined,
      dayChangePercent: cached.dayChangePercent ? parseFloat(cached.dayChangePercent) : undefined,
      marketCap: cached.marketCap ? parseFloat(cached.marketCap) : undefined,
      volume: cached.volume ? parseFloat(cached.volume) : undefined,
    };
  } catch (error) {
    console.error(`[MarketData] Error getting cached data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get market data with cache-first strategy
 */
export async function getMarketData(symbol: string): Promise<MarketPrice | null> {
  // Try to get from cache first
  const cached = await getCachedMarketData(symbol);
  if (cached) {
    return cached;
  }

  // If not in cache, fetch fresh data
  const fresh = await fetchMarketPrice(symbol);
  if (fresh) {
    await updateMarketDataCache(fresh);
    return fresh;
  }

  return null;
}

/**
 * Batch update market data for multiple symbols
 */
export async function updateMultipleMarketPrices(symbols: string[]): Promise<void> {
  const uniqueSymbols = Array.from(new Set(symbols));

  for (const symbol of uniqueSymbols) {
    const data = await fetchMarketPrice(symbol);
    if (data) {
      await updateMarketDataCache(data);
    }
    // Add small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Check and trigger price alerts
 */
export async function checkPriceAlerts(symbol: string, currentPrice: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Get all active alerts for this symbol
    const alerts = await db
      .select()
      .from(priceAlerts)
      .where(
        and(
          eq(priceAlerts.symbol, symbol),
          eq(priceAlerts.isActive, true)
        )
      );

    for (const alert of alerts) {
      const targetPrice = parseFloat(alert.targetPrice);
      let triggered = false;

      if (alert.alertType === "above" && currentPrice >= targetPrice) {
        triggered = true;
      } else if (alert.alertType === "below" && currentPrice <= targetPrice) {
        triggered = true;
      }

      if (triggered) {
        // Create notification
        // TODO: Implement notification creation
        // Mark alert as triggered
        // await db.update(priceAlerts).set({ triggeredAt: new Date() }).where(eq(priceAlerts.id, alert.id));
      }
    }
  } catch (error) {
    console.error(`[MarketData] Error checking price alerts for ${symbol}:`, error);
  }
}
