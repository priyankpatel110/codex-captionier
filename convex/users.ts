import type { UserIdentity } from "convex/server"
import { ConvexError, v } from "convex/values"

import { mutation, query } from "./_generated/server"

const DEFAULT_GENERATION_CREDITS_SECONDS = 10 * 60

type IdentityContext = {
  auth: {
    getUserIdentity(): Promise<UserIdentity | null>
  }
}

type IndexSelector = {
  eq(fieldName: string, value: string): unknown
}

type QueryBuilder = {
  withIndex(
    indexName: string,
    build: (query: IndexSelector) => unknown
  ): {
    collect(): Promise<unknown[]>
    unique(): Promise<unknown>
  }
}

type DatabaseContext = IdentityContext & {
  db: {
    delete(id: string): Promise<void>
    get(id: string): Promise<unknown>
    insert(table: string, value: Record<string, unknown>): Promise<string>
    patch(id: string, value: Record<string, unknown>): Promise<void>
    query(table: string): QueryBuilder
  }
}

type UserDocument = {
  _id: string
  clerkUserId: string
  creditsRemainingSeconds: number
  totalGrantedSeconds: number
}

type ReservationDocument = {
  _id: string
  clerkUserId: string
  requestId: string
  reservedSeconds: number
}

export const getCurrentUserUsage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      return null
    }

    const database = ctx as unknown as DatabaseContext
    const user = await getUserByClerkId(database, identity.subject)
    const pendingSeconds = await getPendingSeconds(database, identity.subject)
    const creditsRemainingSeconds =
      user?.creditsRemainingSeconds ?? DEFAULT_GENERATION_CREDITS_SECONDS
    const totalGrantedSeconds =
      user?.totalGrantedSeconds ?? DEFAULT_GENERATION_CREDITS_SECONDS

    return {
      availableSeconds: Math.max(0, creditsRemainingSeconds - pendingSeconds),
      creditsRemainingSeconds,
      pendingSeconds,
      totalGrantedSeconds,
    }
  },
})

export const reserveGenerationCredits = mutation({
  args: {
    requestId: v.string(),
    reservedSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const database = ctx as unknown as DatabaseContext
    const identity = await requireIdentity(database)
    const now = Date.now()
    const user = await getOrCreateUser(database, identity, now)
    const existingReservation = await getReservationByRequestId(
      database,
      args.requestId
    )

    if (existingReservation) {
      if (existingReservation.clerkUserId !== identity.subject) {
        throw new ConvexError("Reservation already belongs to another user.")
      }

      return buildUsageSummary(
        user.creditsRemainingSeconds,
        await getPendingSeconds(database, identity.subject),
        user.totalGrantedSeconds
      )
    }

    const pendingSeconds = await getPendingSeconds(database, identity.subject)
    const availableSeconds = user.creditsRemainingSeconds - pendingSeconds

    if (args.reservedSeconds > availableSeconds) {
      throw new ConvexError("CREDITS_EXHAUSTED")
    }

    await database.db.insert("generationReservations", {
      clerkUserId: identity.subject,
      createdAt: now,
      requestId: args.requestId,
      reservedSeconds: args.reservedSeconds,
    })

    return buildUsageSummary(
      user.creditsRemainingSeconds,
      pendingSeconds + args.reservedSeconds,
      user.totalGrantedSeconds
    )
  },
})

export const finalizeGenerationCredits = mutation({
  args: {
    requestId: v.string(),
  },
  handler: async (ctx, args) => {
    const database = ctx as unknown as DatabaseContext
    const identity = await requireIdentity(database)
    const reservation = await getReservationByRequestId(
      database,
      args.requestId
    )

    if (!reservation || reservation.clerkUserId !== identity.subject) {
      throw new ConvexError("Reservation not found.")
    }

    const now = Date.now()
    const user = await getOrCreateUser(database, identity, now)
    const nextCredits = Math.max(
      0,
      user.creditsRemainingSeconds - reservation.reservedSeconds
    )

    await database.db.patch(user._id, {
      creditsRemainingSeconds: nextCredits,
      updatedAt: now,
    })
    await database.db.delete(reservation._id)

    const pendingSeconds = await getPendingSeconds(database, identity.subject)
    return buildUsageSummary(
      nextCredits,
      pendingSeconds,
      user.totalGrantedSeconds
    )
  },
})

export const releaseGenerationCredits = mutation({
  args: {
    requestId: v.string(),
  },
  handler: async (ctx, args) => {
    const database = ctx as unknown as DatabaseContext
    const identity = await requireIdentity(database)
    const reservation = await getReservationByRequestId(
      database,
      args.requestId
    )
    const user = await getOrCreateUser(database, identity, Date.now())

    if (!reservation) {
      const pendingSeconds = await getPendingSeconds(database, identity.subject)
      return buildUsageSummary(
        user.creditsRemainingSeconds,
        pendingSeconds,
        user.totalGrantedSeconds
      )
    }

    if (reservation.clerkUserId !== identity.subject) {
      throw new ConvexError("Reservation not found.")
    }

    await database.db.delete(reservation._id)

    const pendingSeconds = await getPendingSeconds(database, identity.subject)
    return buildUsageSummary(
      user.creditsRemainingSeconds,
      pendingSeconds,
      user.totalGrantedSeconds
    )
  },
})

async function requireIdentity(ctx: IdentityContext) {
  const identity = await ctx.auth.getUserIdentity()

  if (!identity) {
    throw new ConvexError("Unauthorized")
  }

  return identity
}

async function getOrCreateUser(
  ctx: DatabaseContext,
  identity: Awaited<ReturnType<typeof requireIdentity>>,
  now: number
) {
  const existingUser = await getUserByClerkId(ctx, identity.subject)

  if (existingUser) {
    const profilePatch = getProfilePatch(identity)

    if (Object.keys(profilePatch).length > 0) {
      await ctx.db.patch(existingUser._id, {
        ...profilePatch,
        updatedAt: now,
      })
      return {
        ...existingUser,
        ...profilePatch,
        updatedAt: now,
      }
    }

    return existingUser
  }

  const profile = getProfilePatch(identity)
  const userId = await ctx.db.insert("users", {
    clerkUserId: identity.subject,
    createdAt: now,
    creditsRemainingSeconds: DEFAULT_GENERATION_CREDITS_SECONDS,
    ...profile,
    totalGrantedSeconds: DEFAULT_GENERATION_CREDITS_SECONDS,
    updatedAt: now,
  })
  const createdUser = (await ctx.db.get(userId)) as UserDocument | null

  if (!createdUser) {
    throw new ConvexError("Failed to create user.")
  }

  return createdUser
}

async function getUserByClerkId(ctx: DatabaseContext, clerkUserId: string) {
  return (await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
    .unique()) as UserDocument | null
}

async function getReservationByRequestId(
  ctx: DatabaseContext,
  requestId: string
) {
  return (await ctx.db
    .query("generationReservations")
    .withIndex("by_request_id", (q) => q.eq("requestId", requestId))
    .unique()) as ReservationDocument | null
}

async function getPendingSeconds(ctx: DatabaseContext, clerkUserId: string) {
  const reservations = (await ctx.db
    .query("generationReservations")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
    .collect()) as ReservationDocument[]

  return reservations.reduce(
    (total, reservation) => total + reservation.reservedSeconds,
    0
  )
}

function buildUsageSummary(
  creditsRemainingSeconds: number,
  pendingSeconds: number,
  totalGrantedSeconds: number
) {
  return {
    availableSeconds: Math.max(0, creditsRemainingSeconds - pendingSeconds),
    creditsRemainingSeconds,
    pendingSeconds,
    totalGrantedSeconds,
  }
}

function getProfilePatch(
  identity: Awaited<ReturnType<typeof requireIdentity>>
) {
  const patch: {
    email?: string
    imageUrl?: string
    name?: string
  } = {}

  if (identity.email) {
    patch.email = identity.email
  }

  if (identity.name) {
    patch.name = identity.name
  }

  if (identity.pictureUrl) {
    patch.imageUrl = identity.pictureUrl
  }

  return patch
}
