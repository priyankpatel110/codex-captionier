"use client"

import { usePaginatedQuery, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  IconSearch,
  IconUser,
  IconChevronRight,
  IconLoader2,
} from "@tabler/icons-react"
import type { Doc } from "@/convex/_generated/dataModel"

type Environment = "development" | "production"

function formatSeconds(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function UserRow({ user }: { user: Doc<"users"> }) {
  return (
    <Link
      href={`/admin/users/${user._id}`}
      className="flex items-center gap-4 rounded-lg border border-border/50 bg-background/50 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
    >
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
        {user.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.imageUrl} alt="" className="size-10 object-cover" />
        ) : (
          <IconUser className="size-5 text-primary" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{user.name ?? "Unknown"}</p>
        <p className="truncate text-sm text-muted-foreground">
          {user.email ?? user.clerkUserId}
        </p>
      </div>

      <div className="hidden flex-col items-end gap-1 text-sm sm:flex">
        <span className="font-medium">
          {formatSeconds(user.creditsRemainingSeconds)} left
        </span>
        <span className="text-muted-foreground">
          {formatSeconds(user.totalGrantedSeconds)} total
        </span>
      </div>

      <p className="hidden shrink-0 text-xs text-muted-foreground md:block">
        {formatDate(user.createdAt)}
      </p>

      {user.billingEnabled ? (
        <span className="hidden shrink-0 items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500 sm:inline-flex">
          Billing On
        </span>
      ) : (
        <span className="hidden shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground sm:inline-flex">
          Billing Off
        </span>
      )}

      <IconChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

function SearchResults({
  searchQuery,
  environment,
}: {
  searchQuery: string
  environment: Environment
}) {
  const results = useQuery(api.admin.searchUsers, {
    query: searchQuery,
    environment,
  })

  if (results === undefined) {
    return (
      <div className="flex justify-center py-10">
        <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <p className="py-10 text-center text-muted-foreground">
        No users found for &ldquo;{searchQuery}&rdquo;
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {results.map((user) => (
        <UserRow key={user._id} user={user} />
      ))}
    </div>
  )
}

function PaginatedUserList({ environment }: { environment: Environment }) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.admin.listUsers,
    { environment },
    { initialNumItems: 25 }
  )

  if (status === "LoadingFirstPage") {
    return (
      <div className="flex justify-center py-10">
        <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <p className="py-10 text-center text-muted-foreground">No users yet.</p>
    )
  }

  return (
    <div className="space-y-2">
      {results.map((user) => (
        <UserRow key={user._id} user={user} />
      ))}
      {status === "CanLoadMore" && (
        <button
          onClick={() => loadMore(25)}
          className="mt-2 w-full rounded-lg border border-border/50 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          Load more
        </button>
      )}
      {status === "LoadingMore" && (
        <div className="flex justify-center py-4">
          <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function AdminUsersView({
  environment,
  title,
  description,
}: {
  environment: Environment
  title: string
  description: string
}) {
  const [searchInput, setSearchInput] = useState("")
  const debouncedQuery = useDebounce(searchInput, 300)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {title}
        </h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>

      <div className="relative mb-6">
        <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full rounded-lg border border-border/50 bg-background/50 py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {debouncedQuery.length >= 2 ? (
        <SearchResults searchQuery={debouncedQuery} environment={environment} />
      ) : (
        <PaginatedUserList environment={environment} />
      )}
    </div>
  )
}
