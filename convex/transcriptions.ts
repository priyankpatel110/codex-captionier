import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

/**
 * Save a newly generated transcription to the database
 */
export const saveTranscription = mutation({
  args: {
    filename: v.string(),
    duration: v.optional(v.number()),
    language: v.optional(v.string()),
    srtContent: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("You must be logged in to save transcriptions")
    }

    const transcriptionId = await ctx.db.insert("transcriptions", {
      clerkUserId: identity.subject,
      filename: args.filename,
      duration: args.duration,
      language: args.language,
      srtContent: args.srtContent,
      createdAt: Date.now(),
    })

    return transcriptionId
  },
})

/**
 * Get all transcriptions for the currently logged in user
 */
export const getTranscriptions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return [] // Or throw an error, but returning empty list is safer for UI rendering
    }

    const transcriptions = await ctx.db
      .query("transcriptions")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .order("desc")
      .collect()

    return transcriptions
  },
})

/**
 * Get a single transcription by ID (owner-gated)
 */
export const getTranscription = query({
  args: { id: v.id("transcriptions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const t = await ctx.db.get(args.id)
    if (!t || t.clerkUserId !== identity.subject) return null
    return t
  },
})

/**
 * Update the SRT content of a transcription (owner-gated)
 */
export const updateSRT = mutation({
  args: { id: v.id("transcriptions"), srtContent: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    const t = await ctx.db.get(args.id)
    if (!t || t.clerkUserId !== identity.subject) throw new Error("Not found")
    await ctx.db.patch(args.id, { srtContent: args.srtContent })
  },
})

/**
 * Delete a transcription by ID
 */
export const deleteTranscription = mutation({
  args: {
    id: v.id("transcriptions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("You must be logged in to delete transcriptions")
    }

    const transcription = await ctx.db.get(args.id)
    if (!transcription || transcription.clerkUserId !== identity.subject) {
      throw new Error("You are not authorized to delete this transcription")
    }

    await ctx.db.delete(args.id)
  },
})
