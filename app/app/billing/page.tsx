"use client"

import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useState } from "react"
import { IconCreditCard, IconCheck, IconLoader2, IconSparkles } from "@tabler/icons-react"

export default function BillingPage() {
  const usage = useQuery(api.users.getCurrentUserUsage)
  const purchaseDummyCredits = useMutation(api.users.purchaseDummyCredits)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const handlePurchase = async () => {
    setIsProcessing(true)
    setSuccessMessage("")
    try {
      await purchaseDummyCredits({ packageId: "pro_1_hour" })
      setSuccessMessage("Successfully upgraded to Pro Tier!")
      setTimeout(() => setSuccessMessage(""), 5000)
    } catch (error) {
      console.error(error)
      setSuccessMessage("Payment failed. Please try again.")
    } finally {
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
          <p className="mt-3 text-center text-xs text-muted-foreground">
            * Dummy payment flow for demo purposes
          </p>
        </div>
      </div>
    </div>
  )
}
