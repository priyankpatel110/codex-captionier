"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import Link from "next/link"
import {
  IconUsers,
  IconCode,
  IconFileText,
  IconClock,
  IconDatabase,
  IconChevronRight,
} from "@tabler/icons-react"

function formatSeconds(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export default function AdminDashboard() {
  const analytics = useQuery(api.admin.getAnalytics, {})
  const prodAnalytics = useQuery(api.admin.getAnalytics, {
    environment: "production",
  })
  const devAnalytics = useQuery(api.admin.getAnalytics, {
    environment: "development",
  })

  const stats = analytics
    ? [
        {
          label: "Production Users",
          value: (prodAnalytics?.totalUsers ?? 0).toLocaleString(),
          icon: IconUsers,
          desc: "Signed in via captionier.priyankhere.com",
        },
        {
          label: "Dev Users",
          value: (devAnalytics?.totalUsers ?? 0).toLocaleString(),
          icon: IconCode,
          desc: "Signed in via localhost / dev testing",
        },
        {
          label: "Total Transcriptions",
          value: analytics.totalTranscriptions.toLocaleString(),
          icon: IconFileText,
          desc: "SRT files generated",
        },
        {
          label: "Credits Used",
          value: formatSeconds(analytics.totalSecondsUsed),
          icon: IconClock,
          desc: "Across all users",
        },
        {
          label: "Credits Granted",
          value: formatSeconds(analytics.totalSecondsGranted),
          icon: IconDatabase,
          desc: "Total credits issued",
        },
      ]
    : []

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Platform overview and key metrics.
        </p>
      </div>

      {!analytics ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-border/50 bg-muted/30"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map(({ label, value, icon: Icon, desc }) => (
            <div
              key={label}
              className="rounded-xl border border-border/50 bg-background/50 p-6 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {label}
                </p>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/admin/users"
          className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-6 shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <div className="flex items-center gap-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <IconUsers className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">User Management</h3>
              <p className="text-sm text-muted-foreground">
                View all users, adjust credits, and control billing access.
              </p>
            </div>
          </div>
          <IconChevronRight className="size-5 text-muted-foreground" />
        </Link>
      </div>
    </div>
  )
}
