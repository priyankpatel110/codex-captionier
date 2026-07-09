import { ConvexError, v } from "convex/values"

import { internal } from "./_generated/api"
import { mutation, query } from "./_generated/server"

const PACKAGES: Record<
  string,
  { amountRupees: number; creditSeconds: number; label: string }
> = {
  pro_1_hour: {
    amountRupees: 49,
    creditSeconds: 3600,
    label: "Pro Tier (1 Hour)",
  },
}

export const getPackage = query({
  args: { packageId: v.string() },
  handler: async (_ctx, args) => {
    const pkg = PACKAGES[args.packageId]

    if (!pkg) {
      throw new ConvexError("Unknown package")
    }

    return pkg
  },
})

export const createPendingPayment = mutation({
  args: {
    orderId: v.string(),
    packageId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new ConvexError("Unauthorized")
    }

    const pkg = PACKAGES[args.packageId]

    if (!pkg) {
      throw new ConvexError("Unknown package")
    }

    const now = Date.now()

    await ctx.db.insert("payments", {
      clerkUserId: identity.subject,
      orderId: args.orderId,
      packageId: args.packageId,
      amountRupees: pkg.amountRupees,
      creditSeconds: pkg.creditSeconds,
      status: "created",
      createdAt: now,
      updatedAt: now,
    })

    return null
  },
})

export const getPaymentStatus = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new ConvexError("Unauthorized")
    }

    const payment = await ctx.db
      .query("payments")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .unique()

    if (!payment || payment.clerkUserId !== identity.subject) {
      return null
    }

    return {
      status: payment.status,
      creditSeconds: payment.creditSeconds,
    }
  },
})

export const markPaymentPaid = mutation({
  args: {
    orderId: v.string(),
    webhookSecret: v.string(),
  },
  handler: async (ctx, args) => {
    requireWebhookSecret(args.webhookSecret)

    const payment = await ctx.db
      .query("payments")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .unique()

    if (!payment) {
      throw new ConvexError("Payment not found")
    }

    if (payment.status === "paid") {
      return null
    }

    await ctx.db.patch(payment._id, { status: "paid", updatedAt: Date.now() })

    await ctx.runMutation(internal.users.creditPurchasedSeconds, {
      clerkUserId: payment.clerkUserId,
      seconds: payment.creditSeconds,
    })

    return null
  },
})

export const markPaymentFailed = mutation({
  args: {
    orderId: v.string(),
    webhookSecret: v.string(),
  },
  handler: async (ctx, args) => {
    requireWebhookSecret(args.webhookSecret)

    const payment = await ctx.db
      .query("payments")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .unique()

    if (!payment || payment.status !== "created") {
      return null
    }

    await ctx.db.patch(payment._id, { status: "failed", updatedAt: Date.now() })

    return null
  },
})

function requireWebhookSecret(secret: string) {
  if (!process.env.CONVEX_WEBHOOK_SECRET || secret !== process.env.CONVEX_WEBHOOK_SECRET) {
    throw new ConvexError("Unauthorized")
  }
}
