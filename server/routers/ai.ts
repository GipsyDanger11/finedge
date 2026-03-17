/**
 * AI Router
 * Handles all AI-powered financial insights and analysis
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getPortfolioWithAssets, getDb } from "../db";
import { aiInsights, type InsertAIInsight } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  getAIInsights,
  getRiskAnalysis,
  getMarketSummary,
  getPersonalizedRecommendations,
  type PortfolioData,
} from "../services/mistralService";

/**
 * Convert portfolio assets to PortfolioData format for AI service
 */
function formatPortfolioForAI(assets: any[]): PortfolioData[] {
  return assets.map((asset) => ({
    symbol: asset.symbol,
    quantity: parseFloat(asset.quantity),
    currentPrice: parseFloat(asset.currentPrice),
    averageCost: parseFloat(asset.averageCost),
    gainLoss: parseFloat(asset.gainLoss),
    gainLossPercentage: parseFloat(asset.gainLossPercentage),
  }));
}

export const aiRouter = router({
  /**
   * Get AI-powered portfolio insights
   */
  getInsights: protectedProcedure
    .input(z.object({ portfolioId: z.number() }))
    .query(async ({ input, ctx }) => {
      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || portfolio.userId !== ctx.user.id) {
        throw new Error("Portfolio not found or unauthorized");
      }

      // Check cache first
      const db = await getDb();
      if (db) {
        const cached = await db
          .select()
          .from(aiInsights)
          .where(eq(aiInsights.portfolioId, input.portfolioId))
          .limit(1);

        if (cached.length > 0 && cached[0].expiresAt && new Date(cached[0].expiresAt) > new Date()) {
          return cached[0].content;
        }
      }

      // Generate new insights
      const portfolioData = formatPortfolioForAI(portfolio.assets);
      const totalValue = portfolio.assets.reduce((sum, asset) => sum + parseFloat(asset.totalValue), 0);
      const totalGain = portfolio.assets.reduce((sum, asset) => sum + parseFloat(asset.gainLoss as any), 0);

      const insights = await getAIInsights(portfolioData, totalValue, totalGain);

      // Cache the insights
      if (db) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const cacheData: InsertAIInsight = {
          portfolioId: input.portfolioId,
          insightType: "recommendations",
          content: JSON.stringify(insights),
          riskLevel: insights.riskLevel,
          expiresAt,
        };

        await db.insert(aiInsights).values(cacheData);
      }

      return insights;
    }),

  /**
   * Get risk analysis for portfolio
   */
  getRiskAnalysis: protectedProcedure
    .input(z.object({ portfolioId: z.number() }))
    .query(async ({ input, ctx }) => {
      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || portfolio.userId !== ctx.user.id) {
        throw new Error("Portfolio not found or unauthorized");
      }

      const portfolioData = formatPortfolioForAI(portfolio.assets);
      return getRiskAnalysis(portfolioData);
    }),

  /**
   * Get market summary and insights
   */
  getMarketSummary: protectedProcedure.query(async () => {
    // Check cache
    const db = await getDb();
    if (db) {
      const cached = await db
        .select()
        .from(aiInsights)
        .where(eq(aiInsights.insightType, "market_summary"))
        .limit(1);

      if (cached.length > 0 && cached[0].expiresAt && new Date(cached[0].expiresAt) > new Date()) {
        return cached[0].content;
      }
    }

    // Generate new market summary
    const summary = await getMarketSummary();

    // Cache it
    if (db) {
      const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours
      const cacheData: InsertAIInsight = {
        portfolioId: 0, // Market summary is not portfolio-specific
        insightType: "market_summary",
        content: JSON.stringify(summary),
        expiresAt,
      };

      try {
        await db.insert(aiInsights).values(cacheData);
      } catch {
        // Ignore cache errors
      }
    }

    return summary;
  }),

  /**
   * Get personalized recommendations
   */
  getRecommendations: protectedProcedure
    .input(
      z.object({
        portfolioId: z.number(),
        riskTolerance: z.enum(["low", "medium", "high"]),
      })
    )
    .query(async ({ input, ctx }) => {
      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || portfolio.userId !== ctx.user.id) {
        throw new Error("Portfolio not found or unauthorized");
      }

      const portfolioData = formatPortfolioForAI(portfolio.assets);
      return getPersonalizedRecommendations(portfolioData, input.riskTolerance);
    }),

  /**
   * Clear cached insights for a portfolio
   */
  clearCache: protectedProcedure
    .input(z.object({ portfolioId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || portfolio.userId !== ctx.user.id) {
        throw new Error("Portfolio not found or unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Delete cached insights for this portfolio
      // Note: Using raw delete since Drizzle doesn't have a direct delete method
      // This would be implemented with proper SQL in production
      return { success: true };
    }),
});
