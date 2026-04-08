import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getMarketData as getMarketPrice,
  updateMultipleMarketPrices,
} from "../services/marketDataService";
import { getAllMarketData } from "../db";

export const marketRouter = router({
  getPrice: protectedProcedure
    .input(z.object({ symbol: z.string().min(1).max(20) }))
    .query(async ({ input }) => {
      const symbol = input.symbol.toUpperCase();
      return getMarketPrice(symbol);
    }),

  getAllCached: protectedProcedure.query(async () => {
    const { getDb } = await import("../db");
    const db = await getDb();
    
    // Fail-safe: if DB is missing, return mock data directly
    if (!db) {
       return [
        { symbol: "AAPL", currentPrice: 228.45, dayHigh: 230.12, dayLow: 226.50, dayChange: 1.25, dayChangePercent: 0.55, marketCap: 3500000000000, volume: 45000000 },
        { symbol: "MSFT", currentPrice: 432.10, dayHigh: 435.00, dayLow: 428.50, dayChange: -2.30, dayChangePercent: -0.53, marketCap: 3200000000000, volume: 22000000 },
        { symbol: "TSLA", currentPrice: 215.80, dayHigh: 220.50, dayLow: 214.00, dayChange: -3.50, dayChangePercent: -1.60, marketCap: 685000000000, volume: 95000000 },
        { symbol: "NVDA", currentPrice: 142.50, dayHigh: 145.20, dayLow: 139.80, dayChange: 5.20, dayChangePercent: 3.79, marketCap: 3450000000000, volume: 150000000 },
        { symbol: "BTC", currentPrice: 65420.00, dayHigh: 66800.00, dayLow: 64100.00, dayChange: 1250.00, dayChangePercent: 1.95, marketCap: 1250000000000, volume: 35000000000 }
      ];
    }

    const { MarketData } = await import("../models");
    const count = await MarketData.countDocuments();
    if (count === 0) {
      await MarketData.insertMany([
        { symbol: "AAPL", currentPrice: 228.45, dayHigh: 230.12, dayLow: 226.50, dayChange: 1.25, dayChangePercent: 0.55, marketCap: 3500000000000, volume: 45000000 },
        { symbol: "MSFT", currentPrice: 432.10, dayHigh: 435.00, dayLow: 428.50, dayChange: -2.30, dayChangePercent: -0.53, marketCap: 3200000000000, volume: 22000000 },
        { symbol: "TSLA", currentPrice: 215.80, dayHigh: 220.50, dayLow: 214.00, dayChange: -3.50, dayChangePercent: -1.60, marketCap: 685000000000, volume: 95000000 },
        { symbol: "NVDA", currentPrice: 142.50, dayHigh: 145.20, dayLow: 139.80, dayChange: 5.20, dayChangePercent: 3.79, marketCap: 3450000000000, volume: 150000000 },
        { symbol: "BTC", currentPrice: 65420.00, dayHigh: 66800.00, dayLow: 64100.00, dayChange: 1250.00, dayChangePercent: 1.95, marketCap: 1250000000000, volume: 35000000000 }
      ]);
    }
    return getAllMarketData();
  }),

  refreshMany: protectedProcedure
    .input(z.object({ symbols: z.array(z.string().min(1).max(20)).max(50) }))
    .mutation(async ({ input }) => {
      const symbols = input.symbols.map((s) => s.toUpperCase());
      await updateMultipleMarketPrices(symbols);
      return { success: true };
    }),
});

