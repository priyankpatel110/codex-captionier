import { v } from "convex/values"
import { paginationOptsValidator } from "convex/server"
import { mutation, query } from "./_generated/server"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import type { Doc } from "./_generated/dataModel"

export const isCurrentUserAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return false
    const adminId = process.env.ADMIN_CLERK_USER_ID
    return Boolean(adminId && identity.subject === adminId)
  },
})

async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<void> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Unauthorized")
  const adminId = process.env.ADMIN_CLERK_USER_ID
  if (!adminId || identity.subject !== adminId) throw new Error("Forbidden")
}

export const getAnalytics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const users = await ctx.db.query("users").collect()
    const transcriptions = await ctx.db.query("transcriptions").collect()

    const totalSecondsGranted = users.reduce((sum, u) => sum + u.totalGrantedSeconds, 0)
    const totalSecondsRemaining = users.reduce((sum, u) => sum + u.creditsRemainingSeconds, 0)

    return {
      totalUsers: users.length,
      totalTranscriptions: transcriptions.length,
      totalSecondsUsed: Math.max(0, totalSecondsGranted - totalSecondsRemaining),
      totalSecondsGranted,
    }
  },
})

export const listUsers = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await ctx.db.query("users").order("desc").paginate(args.paginationOpts)
  },
})

export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    if (args.query.length < 2) return []

    const byEmail = await ctx.db
      .query("users")
      .withSearchIndex("search_by_email", (q) => q.search("email", args.query))
      .take(10)

    const byName = await ctx.db
      .query("users")
      .withSearchIndex("search_by_name", (q) => q.search("name", args.query))
      .take(10)

    const seen = new Set<string>()
    const results: Doc<"users">[] = []
    for (const user of [...byEmail, ...byName]) {
      if (!seen.has(user._id)) {
        seen.add(user._id)
        results.push(user)
      }
    }
    return results
  },
})

export const getUserDetail = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const user = await ctx.db.get(args.userId)
    if (!user) return null

    const transcriptions = await ctx.db
      .query("transcriptions")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", user.clerkUserId))
      .order("desc")
      .collect()

    return { user, transcriptions }
  },
})

export const adjustUserCredits = mutation({
  args: {
    userId: v.id("users"),
    deltaSeconds: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const user = await ctx.db.get(args.userId)
    if (!user) throw new Error("User not found")

    const newCredits = Math.max(0, user.creditsRemainingSeconds + args.deltaSeconds)
    const newTotal =
      args.deltaSeconds > 0
        ? user.totalGrantedSeconds + args.deltaSeconds
        : user.totalGrantedSeconds

    await ctx.db.patch(args.userId, {
      creditsRemainingSeconds: newCredits,
      totalGrantedSeconds: newTotal,
      updatedAt: Date.now(),
    })

    return { creditsRemainingSeconds: newCredits, totalGrantedSeconds: newTotal }
  },
})

export const setUserBillingEnabled = mutation({
  args: {
    userId: v.id("users"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const user = await ctx.db.get(args.userId)
    if (!user) throw new Error("User not found")

    await ctx.db.patch(args.userId, {
      billingEnabled: args.enabled,
      updatedAt: Date.now(),
    })
  },
})
