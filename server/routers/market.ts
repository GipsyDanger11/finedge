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

