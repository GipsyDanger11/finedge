import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getPortfoliosByUserId,
  getPortfolioWithAssets,
  getAssetsByPortfolioId,
  getTransactionsByPortfolioId,
  getDb,
} from "../db";
import { Portfolio, Asset, Transaction } from "../models";
import { Notification } from "../models";

async function ensureGuestSeeded(userId: string) {
  if (userId !== "guest") return;
  const existing = await Portfolio.findOne({ userId: "guest" }).lean();
  if (existing) return;

  const p = await Portfolio.create({
    userId: "guest",
    name: "Tech Vanguard Fund",
    type: "practice",
    initialBalance: 100000,
    currentBalance: 32675,
    isPublic: false,
  });

  await Asset.insertMany([
    { portfolioId: p._id, symbol: "NVDA", assetType: "stock", quantity: 150, averageCost: 85, currentPrice: 142.5, totalValue: 21375, gainLoss: 8625, gainLossPercentage: 67.6 },
    { portfolioId: p._id, symbol: "AAPL", assetType: "stock", quantity: 60, averageCost: 175, currentPrice: 225.2, totalValue: 13512, gainLoss: 3012, gainLossPercentage: 28.6 },
    { portfolioId: p._id, symbol: "MSFT", assetType: "stock", quantity: 40, averageCost: 310, currentPrice: 420.8, totalValue: 16832, gainLoss: 4432, gainLossPercentage: 35.7 },
    { portfolioId: p._id, symbol: "TSLA", assetType: "stock", quantity: 75, averageCost: 200, currentPrice: 208, totalValue: 15600, gainLoss: 600, gainLossPercentage: 4.0 },
  ]);

  await Transaction.insertMany([
    { portfolioId: p._id, type: "buy", symbol: "NVDA", quantity: 150, price: 85, totalAmount: 12750, date: new Date("2023-11-15") },
    { portfolioId: p._id, type: "buy", symbol: "AAPL", quantity: 60, price: 175, totalAmount: 10500, date: new Date("2024-02-10") },
    { portfolioId: p._id, type: "buy", symbol: "MSFT", quantity: 40, price: 310, totalAmount: 12400, date: new Date("2024-01-20") },
    { portfolioId: p._id, type: "buy", symbol: "TSLA", quantity: 75, price: 200, totalAmount: 15000, date: new Date("2024-03-05") },
  ]);
}

export const portfolioRouter = router({
  getPublicWithAssets: publicProcedure
    .input(z.object({ portfolioId: z.string() }))
    .query(async ({ input }) => {
      await getDb();
      const portfolio = await Portfolio.findById(input.portfolioId).lean();
      if (!portfolio || !(portfolio as any).isPublic) {
        throw new Error("Portfolio not found");
      }
      const assets = await Asset.find({ portfolioId: input.portfolioId }).lean();
      return { ...(portfolio as any), assets };
    }),

  overview: protectedProcedure.query(async ({ ctx }) => {
    await getDb();
    await ensureGuestSeeded(ctx.user.id);

    const portfolios = await Portfolio.find({ userId: ctx.user.id }).lean();
    const portfolioIds = portfolios.map((p: any) => p._id);
    const transactionCount =
      portfolioIds.length > 0
        ? await Transaction.countDocuments({ portfolioId: { $in: portfolioIds } })
        : 0;

    const liveCount = portfolios.filter((p: any) => p.type === "live").length;
    const practiceCount = portfolios.filter((p: any) => p.type === "practice").length;

    return {
      portfolioCount: portfolios.length,
      liveCount,
      practiceCount,
      transactionCount,
    };
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    await getDb();
    await ensureGuestSeeded(ctx.user.id);
    return getPortfoliosByUserId(ctx.user.id);
  }),

  getWithAssets: protectedProcedure
    .input(z.object({ portfolioId: z.string() }))
    .query(async ({ input, ctx }) => {
      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || String(portfolio.userId) !== String(ctx.user.id)) {
        throw new Error("Portfolio not found or unauthorized");
      }
      return portfolio;
    }),

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
      await getDb();

      const portfolio = await Portfolio.create({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        type: input.type,
        initialBalance: input.initialBalance,
        currentBalance: input.initialBalance,
        totalInvested: 0,
        totalGain: 0,
        gainPercentage: 0,
      });

      return { success: true, portfolioId: portfolio._id.toString() };
    }),

  update: protectedProcedure
    .input(
      z.object({
        portfolioId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await getDb();

      const portfolio = await Portfolio.findById(input.portfolioId).lean();
      if (!portfolio || String(portfolio.userId) !== String(ctx.user.id)) {
        throw new Error("Portfolio not found or unauthorized");
      }

      const updateData: Record<string, unknown> = {};
      if (input.name) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;

      await Portfolio.findByIdAndUpdate(input.portfolioId, { $set: updateData });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ portfolioId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await getDb();

      const portfolio = await Portfolio.findById(input.portfolioId).lean();
      if (!portfolio || String(portfolio.userId) !== String(ctx.user.id)) {
        throw new Error("Portfolio not found or unauthorized");
      }

      await Portfolio.findByIdAndDelete(input.portfolioId);
      await Asset.deleteMany({ portfolioId: input.portfolioId });
      await Transaction.deleteMany({ portfolioId: input.portfolioId });

      return { success: true };
    }),

  getStats: protectedProcedure
    .input(z.object({ portfolioId: z.string() }))
    .query(async ({ input, ctx }) => {
      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || String(portfolio.userId) !== String(ctx.user.id)) {
        throw new Error("Portfolio not found or unauthorized");
      }

      const totalValue = portfolio.assets.reduce((sum: number, asset: any) => sum + Number(asset.totalValue), 0);
      const totalGain = portfolio.assets.reduce((sum: number, asset: any) => sum + Number(asset.gainLoss), 0);
      const gainPercentage = portfolio.assets.length > 0 ? (totalGain / Number(portfolio.initialBalance)) * 100 : 0;

      return {
        totalValue,
        totalGain,
        gainPercentage,
        assetCount: portfolio.assets.length,
        initialBalance: Number(portfolio.initialBalance),
        currentBalance: Number(portfolio.currentBalance),
      };
    }),

  addAsset: protectedProcedure
    .input(
      z.object({
        portfolioId: z.string(),
        symbol: z.string().min(1).max(20),
        assetType: z.enum(["stock", "crypto", "etf", "commodity", "bond"]),
        quantity: z.number().positive(),
        currentPrice: z.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await getDb();

      const portfolio = await Portfolio.findById(input.portfolioId).lean();
      if (!portfolio || String(portfolio.userId) !== String(ctx.user.id)) {
        throw new Error("Portfolio not found or unauthorized");
      }

      const totalValue = input.quantity * input.currentPrice;
      const asset = await Asset.create({
        portfolioId: input.portfolioId,
        symbol: input.symbol,
        assetType: input.assetType,
        quantity: input.quantity,
        averageCost: input.currentPrice,
        currentPrice: input.currentPrice,
        totalValue: totalValue,
        gainLoss: 0,
        gainLossPercentage: 0,
      });

      return { success: true, assetId: asset._id.toString() };
    }),

  getAssets: protectedProcedure
    .input(z.object({ portfolioId: z.string() }))
    .query(async ({ input, ctx }) => {
      const portfolio = await getPortfolioWithAssets(input.portfolioId);
      if (!portfolio || String(portfolio.userId) !== String(ctx.user.id)) {
        throw new Error("Portfolio not found or unauthorized");
      }
      return portfolio.assets;
    }),

  getTransactions: protectedProcedure
    .input(z.object({ portfolioId: z.string(), limit: z.number().default(50) }))
    .query(async ({ input, ctx }) => {
      await getDb();
      const portfolio = await Portfolio.findById(input.portfolioId).lean();
      if (!portfolio || String(portfolio.userId) !== String(ctx.user.id)) {
        throw new Error("Portfolio not found or unauthorized");
      }
      return getTransactionsByPortfolioId(input.portfolioId, input.limit);
    }),

  addTransaction: protectedProcedure
    .input(
      z.object({
        portfolioId: z.string(),
        assetId: z.string().optional(),
        symbol: z.string().min(1).max(20),
        type: z.enum(["buy", "sell", "transfer"]),
        quantity: z.number().positive(),
        price: z.number().positive(),
        fee: z.number().default(0),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await getDb();

      const portfolio = await Portfolio.findById(input.portfolioId).lean();
      if (!portfolio || String(portfolio.userId) !== String(ctx.user.id)) {
        throw new Error("Portfolio not found or unauthorized");
      }

      const totalAmount = input.quantity * input.price + input.fee;
      
      const transaction = await Transaction.create({
        portfolioId: input.portfolioId,
        assetId: input.assetId,
        symbol: input.symbol,
        type: input.type,
        quantity: input.quantity,
        price: input.price,
        totalAmount: totalAmount,
        fee: input.fee,
        notes: input.notes || undefined,
        transactionDate: new Date(),
      });

      // Simple milestone notifications based on transaction count.
      try {
        const count = await Transaction.countDocuments({ portfolioId: input.portfolioId });
        const milestones = new Set([1, 10, 25, 50, 100]);
        if (milestones.has(count)) {
          await Notification.create({
            userId: ctx.user.id,
            type: "milestone",
            title: "Milestone reached",
            message: `You’ve placed ${count} transaction${count === 1 ? "" : "s"} in this portfolio.`,
            relatedData: { portfolioId: input.portfolioId, transactionCount: count },
            isRead: false,
          });
        }
      } catch {
        // Ignore milestone notification errors.
      }

      return { success: true, transactionId: transaction._id.toString() };
    }),

  updateTransaction: protectedProcedure
    .input(
      z.object({
        transactionId: z.string(),
        portfolioId: z.string(),
        symbol: z.string().min(1).max(20).optional(),
        type: z.enum(["buy", "sell", "transfer"]).optional(),
        quantity: z.number().positive().optional(),
        price: z.number().positive().optional(),
        fee: z.number().min(0).optional(),
        notes: z.string().optional(),
        transactionDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await getDb();

      const portfolio = await Portfolio.findById(input.portfolioId).lean();
      if (!portfolio || String((portfolio as any).userId) !== String(ctx.user.id)) {
        throw new Error("Portfolio not found or unauthorized");
      }

      const tx = await Transaction.findById(input.transactionId).lean();
      if (!tx || String((tx as any).portfolioId) !== String(input.portfolioId)) {
        throw new Error("Transaction not found or unauthorized");
      }

      const updateData: Record<string, unknown> = {};
      if (input.symbol !== undefined) updateData.symbol = input.symbol;
      if (input.type !== undefined) updateData.type = input.type;
      if (input.quantity !== undefined) updateData.quantity = input.quantity;
      if (input.price !== undefined) updateData.price = input.price;
      if (input.fee !== undefined) updateData.fee = input.fee;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.transactionDate !== undefined)
        updateData.transactionDate = input.transactionDate;

      if (
        input.quantity !== undefined ||
        input.price !== undefined ||
        input.fee !== undefined
      ) {
        const qty = input.quantity ?? Number((tx as any).quantity ?? 0);
        const price = input.price ?? Number((tx as any).price ?? 0);
        const fee = input.fee ?? Number((tx as any).fee ?? 0);
        updateData.totalAmount = qty * price + fee;
      }

      await Transaction.findByIdAndUpdate(input.transactionId, { $set: updateData });
      return { success: true };
    }),

  deleteTransaction: protectedProcedure
    .input(z.object({ transactionId: z.string(), portfolioId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await getDb();

      const portfolio = await Portfolio.findById(input.portfolioId).lean();
      if (!portfolio || String((portfolio as any).userId) !== String(ctx.user.id)) {
        throw new Error("Portfolio not found or unauthorized");
      }

      const tx = await Transaction.findById(input.transactionId).lean();
      if (!tx || String((tx as any).portfolioId) !== String(input.portfolioId)) {
        throw new Error("Transaction not found or unauthorized");
      }

      await Transaction.findByIdAndDelete(input.transactionId);
      return { success: true };
    }),
});
