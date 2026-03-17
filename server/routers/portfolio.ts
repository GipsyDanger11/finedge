/**
 * Portfolio Router
 * Handles all portfolio-related operations
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getPortfoliosByUserId,
  getPortfolioWithAssets,
  getAssetsByPortfolioId,
  getTransactionsByPortfolioId,
  getDb,
} from "../db";
import { portfolios, assets, transactions, type InsertPortfolio, type InsertAsset, type InsertTransaction } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const portfolioRouter = router({
  /**
   * Get all portfolios for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return getPortfoliosByUserId(ctx.user.id);
  }),

  /**
   * Get portfolio with all assets
   */
  getWithAssets: protectedProcedure
    .input(z.object({ portfolioId: z.number() }))
    .query(async ({ input, ctx }) => {
      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || portfolio.userId !== ctx.user.id) {
        throw new Error("Portfolio not found or unauthorized");
      }
      return portfolio;
    }),

  /**
   * Create a new portfolio
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        type: z.enum(["live", "practice"]),
        initialBalance: z.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const insertData: InsertPortfolio = {
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        type: input.type,
        initialBalance: input.initialBalance.toString(),
        currentBalance: input.initialBalance.toString(),
        totalInvested: "0",
        totalGain: "0",
        gainPercentage: "0",
      };

      const result = await db.insert(portfolios).values(insertData);
      return { success: true, portfolioId: result[0] };
    }),

  /**
   * Update portfolio details
   */
  update: protectedProcedure
    .input(
      z.object({
        portfolioId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || portfolio.userId !== ctx.user.id) {
        throw new Error("Portfolio not found or unauthorized");
      }

      const updateData: Record<string, unknown> = {};
      if (input.name) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;

      await db.update(portfolios).set(updateData).where(eq(portfolios.id, input.portfolioId));
      return { success: true };
    }),

  /**
   * Delete a portfolio
   */
  delete: protectedProcedure
    .input(z.object({ portfolioId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || portfolio.userId !== ctx.user.id) {
        throw new Error("Portfolio not found or unauthorized");
      }

      await db.delete(portfolios).where(eq(portfolios.id, input.portfolioId));
      return { success: true };
    }),

  /**
   * Get portfolio statistics
   */
  getStats: protectedProcedure
    .input(z.object({ portfolioId: z.number() }))
    .query(async ({ input, ctx }) => {
      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || portfolio.userId !== ctx.user.id) {
        throw new Error("Portfolio not found or unauthorized");
      }

      const totalValue = portfolio.assets.reduce((sum, asset) => sum + parseFloat(asset.totalValue), 0);
      const totalGain = portfolio.assets.reduce((sum, asset) => sum + parseFloat(asset.gainLoss as string), 0);
      const gainPercentage = portfolio.assets.length > 0 ? (totalGain / parseFloat(portfolio.initialBalance)) * 100 : 0;

      return {
        totalValue,
        totalGain,
        gainPercentage,
        assetCount: portfolio.assets.length,
        initialBalance: parseFloat(portfolio.initialBalance),
        currentBalance: parseFloat(portfolio.currentBalance),
      };
    }),

  /**
   * Add asset to portfolio
   */
  addAsset: protectedProcedure
    .input(
      z.object({
        portfolioId: z.number(),
        symbol: z.string().min(1).max(20),
        assetType: z.enum(["stock", "crypto", "etf", "commodity", "bond"]),
        quantity: z.number().positive(),
        currentPrice: z.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || portfolio.userId !== ctx.user.id) {
        throw new Error("Portfolio not found or unauthorized");
      }

      const totalValue = input.quantity * input.currentPrice;
      const insertData: InsertAsset = {
        portfolioId: input.portfolioId,
        symbol: input.symbol,
        assetType: input.assetType,
        quantity: input.quantity.toString(),
        averageCost: input.currentPrice.toString(),
        currentPrice: input.currentPrice.toString(),
        totalValue: totalValue.toString(),
        gainLoss: "0",
        gainLossPercentage: "0",
      };

      const result = await db.insert(assets).values(insertData);
      return { success: true, assetId: result[0] };
    }),

  /**
   * Get assets for portfolio
   */
  getAssets: protectedProcedure
    .input(z.object({ portfolioId: z.number() }))
    .query(async ({ input, ctx }) => {
      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || portfolio.userId !== ctx.user.id) {
        throw new Error("Portfolio not found or unauthorized");
      }
      return portfolio.assets;
    }),

  /**
   * Get transaction history
   */
  getTransactions: protectedProcedure
    .input(z.object({ portfolioId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input, ctx }) => {
      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || portfolio.userId !== ctx.user.id) {
        throw new Error("Portfolio not found or unauthorized");
      }
      return getTransactionsByPortfolioId(input.portfolioId, input.limit);
    }),

  /**
   * Add transaction
   */
  addTransaction: protectedProcedure
    .input(
      z.object({
        portfolioId: z.number(),
        assetId: z.number().optional(),
        symbol: z.string().min(1).max(20),
        type: z.enum(["buy", "sell", "transfer"]),
        quantity: z.number().positive(),
        price: z.number().positive(),
        fee: z.number().default(0),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || portfolio.userId !== ctx.user.id) {
        throw new Error("Portfolio not found or unauthorized");
      }

      const totalAmount = input.quantity * input.price + input.fee;
      const insertData: InsertTransaction = {
        portfolioId: input.portfolioId,
        assetId: input.assetId,
        symbol: input.symbol,
        type: input.type,
        quantity: input.quantity.toString(),
        price: input.price.toString(),
        totalAmount: totalAmount.toString(),
        fee: input.fee.toString(),
        notes: input.notes || undefined,
        transactionDate: new Date(),
      };

      const result = await db.insert(transactions).values(insertData);
      return { success: true, transactionId: result[0] };
    }),
});
