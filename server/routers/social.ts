import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb, getUserProfile, getUserFollowers, getUserFollowing, isUserFollowing } from "../db";
import { UserProfile, Follow } from "../models";

export const socialRouter = router({
  discover: protectedProcedure
    .input(
      z
        .object({
          q: z.string().max(100).optional(),
          limit: z.number().min(1).max(50).default(20),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      await getDb();
      const limit = input?.limit ?? 20;
      const q = input?.q?.trim();

      const query: Record<string, unknown> = {
        portfolioVisibility: "public",
        userId: { $ne: ctx.user.id },
      };

      if (q) {
        query.displayName = { $regex: q, $options: "i" };
      }

      const profiles = await UserProfile.find(query).limit(limit).lean();
      const userIds = profiles.map((p: any) => String(p.userId)).filter(Boolean);

      const follows = await Follow.find({
        followerId: ctx.user.id,
        followingId: { $in: userIds },
      }).lean();

      const followingSet = new Set(follows.map((f: any) => String(f.followingId)));

      return profiles.map((p: any) => ({
        ...p,
        isFollowing: followingSet.has(String(p.userId)),
      }));
    }),

  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const profile = await getUserProfile(input.userId);
      if (!profile) {
        throw new Error("User profile not found");
      }
      return profile;
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(1).max(255).optional(),
        bio: z.string().max(500).optional(),
        avatarUrl: z.string().url().optional(),
        portfolioVisibility: z.enum(["private", "public", "friends"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await getDb();

      let profile = await getUserProfile(ctx.user.id);

      if (!profile) {
        // Create new profile
        const createData = {
          userId: ctx.user.id,
          displayName: input.displayName || ctx.user.name || "User",
          bio: input.bio,
          avatarUrl: input.avatarUrl || ctx.user.avatarUrl,
          portfolioVisibility: input.portfolioVisibility || "private",
        };

        await UserProfile.create(createData);
        profile = await getUserProfile(ctx.user.id);
      } else {
        // Update existing profile
        const updateData: Record<string, unknown> = {};
        if (input.displayName) updateData.displayName = input.displayName;
        if (input.bio !== undefined) updateData.bio = input.bio;
        if (input.avatarUrl) updateData.avatarUrl = input.avatarUrl;
        if (input.portfolioVisibility) updateData.portfolioVisibility = input.portfolioVisibility;

        await UserProfile.findOneAndUpdate({ userId: ctx.user.id }, { $set: updateData });
        profile = await getUserProfile(ctx.user.id);
      }

      return profile;
    }),

  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getUserProfile(ctx.user.id);
    if (!profile) {
      return {
        _id: null,
        userId: ctx.user.id,
        displayName: ctx.user.name || "User",
        bio: null,
        avatarUrl: ctx.user.avatarUrl,
        portfolioVisibility: "private",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    return profile;
  }),

  follow: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id) {
        throw new Error("Cannot follow yourself");
      }

      await getDb();

      const alreadyFollowing = await isUserFollowing(ctx.user.id, input.userId);
      if (alreadyFollowing) {
        return { success: false, message: "Already following this user" };
      }

      await Follow.create({
        followerId: ctx.user.id,
        followingId: input.userId,
      });

      return { success: true };
    }),

  unfollow: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await getDb();

      await Follow.findOneAndDelete({
        followerId: ctx.user.id,
        followingId: input.userId
      });

      return { success: true };
    }),

  getFollowers: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const followers = await getUserFollowers(input.userId);
      return followers;
    }),

  getFollowing: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const following = await getUserFollowing(input.userId);
      return following;
    }),

  isFollowing: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      return isUserFollowing(ctx.user.id, input.userId);
    }),

  getFollowerCount: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const followers = await getUserFollowers(input.userId);
      return followers.length;
    }),

  getFollowingCount: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const following = await getUserFollowing(input.userId);
      return following.length;
    }),
});
