/**
 * Social Router
 * Handles user profiles, following relationships, and social features
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb, getUserProfile, getUserFollowers, getUserFollowing, isUserFollowing } from "../db";
import { userProfiles, follows, users, type InsertUserProfile, type InsertFollow } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const socialRouter = router({
  /**
   * Get user profile
   */
  getProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const profile = await getUserProfile(input.userId);
      if (!profile) {
        throw new Error("User profile not found");
      }
      return profile;
    }),

  /**
   * Update current user's profile
   */
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
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      let profile = await getUserProfile(ctx.user.id);

      if (!profile) {
        // Create new profile
        const createData: InsertUserProfile = {
          userId: ctx.user.id,
          displayName: input.displayName || ctx.user.name || "User",
          bio: input.bio,
          avatarUrl: input.avatarUrl || ctx.user.avatarUrl,
          portfolioVisibility: input.portfolioVisibility || "private",
        };

        await db.insert(userProfiles).values(createData);
        profile = await getUserProfile(ctx.user.id);
      } else {
        // Update existing profile
        const updateData: Record<string, unknown> = {};
        if (input.displayName) updateData.displayName = input.displayName;
        if (input.bio !== undefined) updateData.bio = input.bio;
        if (input.avatarUrl) updateData.avatarUrl = input.avatarUrl;
        if (input.portfolioVisibility) updateData.portfolioVisibility = input.portfolioVisibility;

        await db.update(userProfiles).set(updateData).where(eq(userProfiles.userId, ctx.user.id));
        profile = await getUserProfile(ctx.user.id);
      }

      return profile;
    }),

  /**
   * Get current user's profile
   */
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getUserProfile(ctx.user.id);
    if (!profile) {
      // Return default profile if not created yet
      return {
        id: 0,
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

  /**
   * Follow a user
   */
  follow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id) {
        throw new Error("Cannot follow yourself");
      }

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check if already following
      const alreadyFollowing = await isUserFollowing(ctx.user.id, input.userId);
      if (alreadyFollowing) {
        return { success: false, message: "Already following this user" };
      }

      const followData: InsertFollow = {
        followerId: ctx.user.id,
        followingId: input.userId,
      };

      await db.insert(follows).values(followData);
      return { success: true };
    }),

  /**
   * Unfollow a user
   */
  unfollow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .delete(follows)
        .where(
          and(eq(follows.followerId, ctx.user.id), eq(follows.followingId, input.userId))
        );

      return { success: true };
    }),

  /**
   * Get user's followers
   */
  getFollowers: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const followers = await getUserFollowers(input.userId);
      return followers;
    }),

  /**
   * Get user's following list
   */
  getFollowing: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const following = await getUserFollowing(input.userId);
      return following;
    }),

  /**
   * Check if following a user
   */
  isFollowing: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }) => {
      return isUserFollowing(ctx.user.id, input.userId);
    }),

  /**
   * Get follower count
   */
  getFollowerCount: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const followers = await getUserFollowers(input.userId);
      return followers.length;
    }),

  /**
   * Get following count
   */
  getFollowingCount: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const following = await getUserFollowing(input.userId);
      return following.length;
    }),
});
