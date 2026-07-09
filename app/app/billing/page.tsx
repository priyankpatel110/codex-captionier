"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useEffect, useState } from "react"
import { load } from "@cashfreepayments/cashfree-js"
import { IconCreditCard, IconCheck, IconLoader2, IconSparkles } from "@tabler/icons-react"

export default function BillingPage() {
  const usage = useQuery(api.users.getCurrentUserUsage)

  const [isProcessing, setIsProcessing] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)

  const paymentStatus = useQuery(
    api.payments.getPaymentStatus,
    pendingOrderId ? { orderId: pendingOrderId } : "skip"
  )

  useEffect(() => {
    if (!paymentStatus) return

    if (paymentStatus.status === "paid") {
      setSuccessMessage("Successfully upgraded to Pro Tier!")
      setPendingOrderId(null)
      setIsProcessing(false)
      setTimeout(() => setSuccessMessage(""), 5000)
    } else if (paymentStatus.status === "failed") {
      setSuccessMessage("Payment failed. Please try again.")
      setPendingOrderId(null)
      setIsProcessing(false)
    }
  }, [paymentStatus])

  const handlePurchase = async () => {
    setIsProcessing(true)
    setSuccessMessage("")
    try {
      const response = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: "pro_1_hour" }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to start checkout.")
      }

      setPendingOrderId(data.orderId)

      const cashfree = await load({
        mode:
          process.env.NEXT_PUBLIC_CASHFREE_MODE === "production"
            ? "production"
            : "sandbox",
      })

      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_modal",
      })
      // Checkout modal closed. The actual credit grant is driven by the
      // Cashfree webhook, which the `paymentStatus` query above picks up
      // reactively once it lands, so nothing else to do here.
    } catch (error) {
      console.error(error)
      setSuccessMessage("Payment failed. Please try again.")
      setIsProcessing(false)
    }
  }

  const formatSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="container md:mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col items-start gap-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Billing & Credits</h1>
        <p className="text-muted-foreground">Manage your transcription credits and upgrades.</p>
      </div>

      {successMessage && (
        <div className="mb-6 rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-green-500">
          {successMessage}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Balance Card */}
        <div className="rounded-xl border border-border/50 bg-background/50 p-6 shadow-sm backdrop-blur-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
            <IconCreditCard className="size-5 text-primary" />
            Current Balance
          </h2>
          {usage ? (
            <div className="flex flex-col gap-2">
              <div className="text-4xl font-bold text-foreground">
                {formatSeconds(usage.availableSeconds)}
              </div>
              <p className="text-sm text-muted-foreground">
                Available for generation
              </p>
              
              <div className="mt-4 flex flex-col gap-1 text-sm text-muted-foreground">
                <div className="flex justify-between border-t border-border/10 pt-2">
                  <span>Total Granted:</span>
                  <span className="font-medium text-foreground">{formatSeconds(usage.totalGrantedSeconds)}</span>
                </div>
                <div className="flex justify-between border-t border-border/10 pt-2">
                  <span>Pending Jobs:</span>
                  <span className="font-medium text-foreground">{formatSeconds(usage.pendingSeconds)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center">
              <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Upgrade Card */}
        {usage?.billingEnabled ? (
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-b from-primary/10 to-transparent p-6 shadow-sm">
            <div className="absolute right-0 top-0 rounded-bl-xl bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-wider text-primary-foreground">
              Most Popular
            </div>

            <h2 className="mb-2 text-xl font-bold flex items-center gap-2">
              <IconSparkles className="size-5 text-primary" />
              Pro Tier
            </h2>
            <div className="mb-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold">₹49</span>
              <span className="text-muted-foreground">/ hour</span>
            </div>

            <p className="mb-6 text-sm text-muted-foreground">
              Perfect for creators. Add instant credits to your account.
            </p>

            <ul className="mb-6 space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <IconCheck className="size-4 text-primary" />
                <span>+1 Hour (60 mins) generation time</span>
              </li>
              <li className="flex items-center gap-2">
                <IconCheck className="size-4 text-primary" />
                <span>Never expires</span>
              </li>
              <li className="flex items-center gap-2">
                <IconCheck className="size-4 text-primary" />
                <span>Priority support</span>
              </li>
            </ul>

            <button
              onClick={handlePurchase}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <IconLoader2 className="size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Buy Now"
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-background/50 p-6 text-center shadow-sm">
            <IconSparkles className="mb-3 size-8 text-muted-foreground/50" />
            <h2 className="font-semibold">Want more credits?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Contact support to purchase additional generation credits for your
              account.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
