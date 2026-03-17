import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { Notification } from "../models";

export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
    .query(async ({ input, ctx }) => {
      await getDb();
      const limit = input?.limit ?? 50;
      return Notification.find({ userId: ctx.user.id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    }),

  markRead: protectedProcedure
    .input(z.object({ notificationId: z.string(), isRead: z.boolean().default(true) }))
    .mutation(async ({ input, ctx }) => {
      await getDb();
      const doc = await Notification.findById(input.notificationId).lean();
      if (!doc || String((doc as any).userId) !== String(ctx.user.id)) {
        throw new Error("Notification not found or unauthorized");
      }
      await Notification.findByIdAndUpdate(input.notificationId, {
        $set: { isRead: input.isRead },
      });
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await getDb();
    await Notification.updateMany({ userId: ctx.user.id }, { $set: { isRead: true } });
    return { success: true };
  }),
});

