"use client"

import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useParams } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import {
  IconArrowLeft,
  IconUser,
  IconCreditCard,
  IconFileText,
  IconLoader2,
  IconCheck,
  IconX,
} from "@tabler/icons-react"
import type { Id } from "@/convex/_generated/dataModel"

function formatSeconds(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${secs}s`
  return `${secs}s`
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const QUICK_ADJUSTMENTS = [
  { label: "+10m", delta: 600 },
  { label: "+30m", delta: 1800 },
  { label: "+1h", delta: 3600 },
  { label: "-10m", delta: -600 },
  { label: "-30m", delta: -1800 },
]

export default function UserDetailPage() {
  const { userId } = useParams()
  const data = useQuery(api.admin.getUserDetail, {
    userId: userId as Id<"users">,
  })
  const adjustCredits = useMutation(api.admin.adjustUserCredits)
  const setBillingEnabled = useMutation(api.admin.setUserBillingEnabled)

  const [customDelta, setCustomDelta] = useState("")
  const [reason, setReason] = useState("")
  const [adjusting, setAdjusting] = useState(false)
  const [billingToggling, setBillingToggling] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    msg: string
  } | null>(null)

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleAdjust = async (delta: number, customReason?: string) => {
    setAdjusting(true)
    try {
      const result = await adjustCredits({
        userId: userId as Id<"users">,
        deltaSeconds: delta,
        reason: customReason,
      })
      showFeedback(
        "success",
        `Credits updated → ${formatSeconds(result.creditsRemainingSeconds)} remaining`
      )
      setCustomDelta("")
      setReason("")
    } catch {
      showFeedback("error", "Failed to adjust credits. Please try again.")
    } finally {
      setAdjusting(false)
    }
  }

  const handleCustomAdjust = () => {
    const delta = parseInt(customDelta)
    if (isNaN(delta) || delta === 0) return
    handleAdjust(delta, reason || undefined)
  }

  const handleBillingToggle = async () => {
    if (!data?.user) return
    setBillingToggling(true)
    try {
      await setBillingEnabled({
        userId: userId as Id<"users">,
        enabled: !data.user.billingEnabled,
      })
    } catch {
      showFeedback("error", "Failed to update billing setting.")
    } finally {
      setBillingToggling(false)
    }
  }

  if (data === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (data === null) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">User not found.</p>
        <Link
          href="/admin/users"
          className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <IconArrowLeft className="size-4" /> Back to Users
        </Link>
      </div>
    )
  }

  const { user, transcriptions } = data

  return (
    <div className="p-8">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <IconArrowLeft className="size-4" />
        Back to Users
      </Link>

      {/* User Header */}
      <div className="mt-6 flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
          {user.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.imageUrl}
              alt=""
              className="size-16 object-cover"
            />
          ) : (
            <IconUser className="size-8 text-primary" />
          )}
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {user.name ?? "Unknown User"}
          </h1>
          <p className="text-muted-foreground">{user.email ?? "No email"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Joined {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`mt-6 flex items-center gap-2 rounded-lg border p-3 text-sm ${
            feedback.type === "success"
              ? "border-green-500/20 bg-green-500/10 text-green-500"
              : "border-red-500/20 bg-red-500/10 text-red-500"
          }`}
        >
          {feedback.type === "success" ? (
            <IconCheck className="size-4 shrink-0" />
          ) : (
            <IconX className="size-4 shrink-0" />
          )}
          {feedback.msg}
        </div>
      )}

      {/* Credit Summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-background/50 p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Credits Remaining
          </p>
          <p className="mt-2 text-3xl font-bold">
            {formatSeconds(user.creditsRemainingSeconds)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Available for generation
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-background/50 p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Total Granted
          </p>
          <p className="mt-2 text-3xl font-bold">
            {formatSeconds(user.totalGrantedSeconds)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Lifetime credits issued
          </p>
        </div>
      </div>

      {/* Credit Adjustment */}
      <div className="mt-6 rounded-xl border border-border/50 bg-background/50 p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <IconCreditCard className="size-5 text-primary" />
          Adjust Credits
        </h2>

        <div className="mb-4 flex flex-wrap gap-2">
          {QUICK_ADJUSTMENTS.map(({ label, delta }) => (
            <button
              key={label}
              onClick={() => handleAdjust(delta)}
              disabled={adjusting}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                delta > 0
                  ? "border-green-500/20 bg-green-500/10 text-green-500 hover:bg-green-500/20"
                  : "border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="number"
            placeholder="Custom seconds (+ or −)"
            value={customDelta}
            onChange={(e) => setCustomDelta(e.target.value)}
            className="flex-1 rounded-lg border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex-1 rounded-lg border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <button
            onClick={handleCustomAdjust}
            disabled={adjusting || !customDelta || customDelta === "0"}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {adjusting ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              "Apply"
            )}
          </button>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="mt-6 rounded-xl border border-border/50 bg-background/50 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Buy Now Button</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              When enabled, this user sees the &ldquo;Buy Now&rdquo; button on
              the billing page and can purchase credits.
            </p>
          </div>
          <button
            onClick={handleBillingToggle}
            disabled={billingToggling}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 ${
              user.billingEnabled ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
                user.billingEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Status:{" "}
          <span
            className={
              user.billingEnabled ? "text-green-500" : "text-muted-foreground"
            }
          >
            {user.billingEnabled ? "Billing enabled" : "Billing disabled"}
          </span>
        </p>
      </div>

      {/* Transcriptions */}
      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <IconFileText className="size-5 text-primary" />
          Transcriptions ({transcriptions.length})
        </h2>

        {transcriptions.length === 0 ? (
          <p className="rounded-xl border border-border/50 bg-background/50 p-6 text-center text-sm text-muted-foreground">
            No transcriptions yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/50">
            <table className="w-full text-sm">
              <thead className="border-b border-border/50 bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    File
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                    Language
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {transcriptions.map((t) => (
                  <tr
                    key={t._id}
                    className="bg-background/50 transition-colors hover:bg-muted/20"
                  >
                    <td className="max-w-[200px] truncate px-4 py-3 font-medium">
                      {t.filename}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {t.language ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {t.duration != null ? formatSeconds(t.duration) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatDate(t.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
