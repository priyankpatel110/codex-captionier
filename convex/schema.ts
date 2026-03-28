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
  }).index("by_clerk_user_id", ["clerkUserId"]),
})
