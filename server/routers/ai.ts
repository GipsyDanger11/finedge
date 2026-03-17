import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getPortfolioWithAssets, getDb } from "../db";
import { AIInsight, Portfolio } from "../models";
import {
  getAIInsights,
  getRiskAnalysis,
  getMarketSummary,
  getPersonalizedRecommendations,
  type PortfolioData,
} from "../services/mistralService";

function formatPortfolioForAI(assets: any[]): PortfolioData[] {
  return assets.map((asset) => ({
    symbol: asset.symbol,
    quantity: Number(asset.quantity),
    currentPrice: Number(asset.currentPrice),
    averageCost: Number(asset.averageCost),
    gainLoss: Number(asset.gainLoss),
    gainLossPercentage: Number(asset.gainLossPercentage),
  }));
}

export const aiRouter = router({
  getPublicInsights: publicProcedure
    .input(z.object({ portfolioId: z.string() }))
    .query(async ({ input }) => {
      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || !(portfolio as any).isPublic) {
        throw new Error("Portfolio not found");
      }

      await getDb();

      // Reuse cache if present.
      const cached = await AIInsight.findOne({
        portfolioId: input.portfolioId,
        insightType: "recommendations",
      }).lean();

      if (cached && (cached as any).expiresAt && new Date((cached as any).expiresAt) > new Date()) {
        return (cached as any).content;
      }

      const portfolioData = formatPortfolioForAI((portfolio as any).assets ?? []);
      const totalValue = (portfolio as any).assets.reduce(
        (sum: number, asset: any) => sum + Number(asset.totalValue),
        0
      );
      const totalGain = (portfolio as any).assets.reduce(
        (sum: number, asset: any) => sum + Number(asset.gainLoss),
        0
      );

      const insights = await getAIInsights(portfolioData, totalValue, totalGain);

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await AIInsight.updateOne(
        { portfolioId: input.portfolioId, insightType: "recommendations" },
        { $set: { content: insights, riskLevel: (insights as any).riskLevel, expiresAt } },
        { upsert: true }
      );

      return insights;
    }),

  getInsights: protectedProcedure
    .input(z.object({ portfolioId: z.string() }))
    .query(async ({ input, ctx }) => {
      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || String(portfolio.userId) !== String(ctx.user.id)) {
        throw new Error("Portfolio not found or unauthorized");
      }

      await getDb();

      // Check cache first
      const cached = await AIInsight.findOne({
        portfolioId: input.portfolioId,
        insightType: "recommendations"
      }).lean();

      if (cached && cached.expiresAt && new Date(cached.expiresAt) > new Date()) {
        return cached.content;
      }

      const portfolioData = formatPortfolioForAI(portfolio.assets);
      const totalValue = portfolio.assets.reduce((sum: number, asset: any) => sum + Number(asset.totalValue), 0);
      const totalGain = portfolio.assets.reduce((sum: number, asset: any) => sum + Number(asset.gainLoss), 0);

      const insights = await getAIInsights(portfolioData, totalValue, totalGain);

      // Cache the insights
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await AIInsight.updateOne(
        { portfolioId: input.portfolioId, insightType: "recommendations" },
        {
          $set: {
            content: insights,
            riskLevel: insights.riskLevel,
            expiresAt,
          }
        },
        { upsert: true }
      );

      return insights;
    }),

  getRiskAnalysis: protectedProcedure
    .input(z.object({ portfolioId: z.string() }))
    .query(async ({ input, ctx }) => {
      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || String(portfolio.userId) !== String(ctx.user.id)) {
        throw new Error("Portfolio not found or unauthorized");
      }

      const portfolioData = formatPortfolioForAI(portfolio.assets);
      return getRiskAnalysis(portfolioData);
    }),

  getMarketSummary: protectedProcedure.query(async () => {
    await getDb();
    
    // Check cache
    const cached = await AIInsight.findOne({
      insightType: "market_summary"
    }).lean();

    if (cached && cached.expiresAt && new Date(cached.expiresAt) > new Date()) {
      return cached.content;
    }

    const summary = await getMarketSummary();

    // Cache it
    try {
      const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours
      
      // using a dummy unqueryable object id for application level insights
      await AIInsight.updateOne(
        { insightType: "market_summary" },
        {
          $set: {
            portfolioId: "000000000000000000000000",
            content: summary,
            expiresAt,
          }
        },
        { upsert: true }
      );
    } catch {
      // Ignore cache errors
    }

    return summary;
  }),

  getRecommendations: protectedProcedure
    .input(
      z.object({
        portfolioId: z.string(),
        riskTolerance: z.enum(["low", "medium", "high"]),
      })
    )
    .query(async ({ input, ctx }) => {
      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || String(portfolio.userId) !== String(ctx.user.id)) {
        throw new Error("Portfolio not found or unauthorized");
      }

      const portfolioData = formatPortfolioForAI(portfolio.assets);
      return getPersonalizedRecommendations(portfolioData, input.riskTolerance);
    }),

  clearCache: protectedProcedure
    .input(z.object({ portfolioId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || String(portfolio.userId) !== String(ctx.user.id)) {
        throw new Error("Portfolio not found or unauthorized");
      }

      await getDb();
      await AIInsight.deleteMany({ portfolioId: input.portfolioId });

      return { success: true };
    }),
});
