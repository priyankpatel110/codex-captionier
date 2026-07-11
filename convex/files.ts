import { ConvexError, v } from "convex/values"

import { mutation, query } from "./_generated/server"

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError("Unauthorized")
    }

    return await ctx.storage.generateUploadUrl()
  },
})

export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError("Unauthorized")
    }

    return await ctx.storage.getUrl(args.storageId)
  },
})

export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError("Unauthorized")
    }

    await ctx.storage.delete(args.storageId)
  },
})
