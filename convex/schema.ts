import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  generationReservations: defineTable({
    clerkUserId: v.string(),
    createdAt: v.number(),
    requestId: v.string(),
    reservedSeconds: v.number(),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_request_id", ["requestId"]),
  users: defineTable({
    clerkUserId: v.string(),
    createdAt: v.number(),
    creditsRemainingSeconds: v.number(),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    name: v.optional(v.string()),
    totalGrantedSeconds: v.number(),
    updatedAt: v.number(),
    billingEnabled: v.optional(v.boolean()),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .searchIndex("search_by_email", { searchField: "email" })
    .searchIndex("search_by_name", { searchField: "name" }),
  transcriptions: defineTable({
    clerkUserId: v.string(),
    filename: v.string(),
    duration: v.optional(v.number()),
    language: v.optional(v.string()),
    srtContent: v.string(),
    createdAt: v.number(),
  }).index("by_clerk_user_id", ["clerkUserId"]),
  payments: defineTable({
    clerkUserId: v.string(),
    orderId: v.string(),
    packageId: v.string(),
    amountRupees: v.number(),
    creditSeconds: v.number(),
    status: v.union(
      v.literal("created"),
      v.literal("paid"),
      v.literal("failed")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_order_id", ["orderId"])
    .index("by_clerk_user_id", ["clerkUserId"]),
})
