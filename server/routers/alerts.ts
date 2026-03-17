import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { PriceAlert } from "../models";

export const alertsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    await getDb();
    return PriceAlert.find({ userId: ctx.user.id }).sort({ createdAt: -1 }).lean();
  }),

  create: protectedProcedure
    .input(
      z.object({
        symbol: z.string().min(1).max(20),
        alertType: z.enum(["above", "below"]),
        targetPrice: z.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await getDb();
      const doc = await PriceAlert.create({
        userId: ctx.user.id,
        symbol: input.symbol.toUpperCase(),
        alertType: input.alertType,
        targetPrice: input.targetPrice,
        isActive: true,
      });
      return { success: true, alertId: String(doc._id) };
    }),

  deactivate: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await getDb();
      const alert = await PriceAlert.findById(input.alertId).lean();
      if (!alert || String((alert as any).userId) !== String(ctx.user.id)) {
        throw new Error("Alert not found or unauthorized");
      }
      await PriceAlert.findByIdAndUpdate(input.alertId, { $set: { isActive: false } });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await getDb();
      const alert = await PriceAlert.findById(input.alertId).lean();
      if (!alert || String((alert as any).userId) !== String(ctx.user.id)) {
        throw new Error("Alert not found or unauthorized");
      }
      await PriceAlert.findByIdAndDelete(input.alertId);
      return { success: true };
    }),
});

