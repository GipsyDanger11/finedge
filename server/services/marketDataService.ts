import { getDb } from "../db";
import { MarketData, Notification, PriceAlert } from "../models";

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

export async function fetchMarketPrice(symbol: string): Promise<MarketPrice | null> {
  try {
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

export async function updateMarketDataCache(data: MarketPrice): Promise<void> {
  await getDb();
  try {
    await MarketData.findOneAndUpdate(
      { symbol: data.symbol },
      {
        $set: {
          currentPrice: data.currentPrice,
          dayHigh: data.dayHigh,
          dayLow: data.dayLow,
          dayChange: data.dayChange,
          dayChangePercent: data.dayChangePercent,
          marketCap: data.marketCap,
          volume: data.volume,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error(`[MarketData] Error updating cache for ${data.symbol}:`, error);
  }
}

export async function getCachedMarketData(symbol: string): Promise<MarketPrice | null> {
  await getDb();
  try {
    const cached = await MarketData.findOne({ symbol }).lean();
    if (!cached) return null;

    return {
      symbol: cached.symbol,
      currentPrice: cached.currentPrice,
      dayHigh: cached.dayHigh,
      dayLow: cached.dayLow,
      dayChange: cached.dayChange,
      dayChangePercent: cached.dayChangePercent,
      marketCap: cached.marketCap,
      volume: cached.volume,
    };
  } catch (error) {
    console.error(`[MarketData] Error getting cached data for ${symbol}:`, error);
    return null;
  }
}

export async function getMarketData(symbol: string): Promise<MarketPrice | null> {
  const cached = await getCachedMarketData(symbol);
  if (cached) return cached;

  const fresh = await fetchMarketPrice(symbol);
  if (fresh) {
    await updateMarketDataCache(fresh);
    return fresh;
  }
  return null;
}

export async function updateMultipleMarketPrices(symbols: string[]): Promise<void> {
  const uniqueSymbols = Array.from(new Set(symbols));
  for (const symbol of uniqueSymbols) {
    const data = await fetchMarketPrice(symbol);
    if (data) {
      await updateMarketDataCache(data);
      await checkPriceAlerts(data.symbol, data.currentPrice);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export async function checkPriceAlerts(symbol: string, currentPrice: number): Promise<void> {
  await getDb();
  try {
    const alerts = await PriceAlert.find({
      symbol,
      isActive: true
    }).lean();

    for (const alert of alerts) {
      const targetPrice = alert.targetPrice;
      let triggered = false;

      if (alert.alertType === "above" && currentPrice >= targetPrice) {
        triggered = true;
      } else if (alert.alertType === "below" && currentPrice <= targetPrice) {
        triggered = true;
      }

      if (triggered) {
        const triggeredAt = new Date();
        await PriceAlert.findByIdAndUpdate((alert as any)._id, {
          $set: { triggeredAt, isActive: false },
        });

        await Notification.create({
          userId: (alert as any).userId,
          type: "price_alert",
          title: `Price alert: ${String(symbol).toUpperCase()}`,
          message: `${String(symbol).toUpperCase()} is ${alert.alertType} ${Number(
            targetPrice
          ).toFixed(2)} (now ${Number(currentPrice).toFixed(2)})`,
          relatedData: {
            symbol: String(symbol).toUpperCase(),
            alertType: alert.alertType,
            targetPrice,
            currentPrice,
            triggeredAt,
          },
          isRead: false,
        });
      }
    }
  } catch (error) {
    console.error(`[MarketData] Error checking price alerts for ${symbol}:`, error);
  }
}
