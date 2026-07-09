"use client"

import { UserButton, useUser } from "@clerk/nextjs"
import Link from "next/link"
import { IconMicrophone, IconLayoutDashboard, IconPlus, IconCreditCard, IconShieldCog } from "@tabler/icons-react"
import { ReactNode, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function AppLayout({ children }: { children: ReactNode }) {
  const usage = useQuery(api.users.getCurrentUserUsage)
  const isAdmin = useQuery(api.admin.isCurrentUserAdmin)
  const { user: clerkUser } = useUser()
  const ensureUser = useMutation(api.users.ensureUser)

  useEffect(() => {
    if (!clerkUser) return
    ensureUser({
      name: clerkUser.fullName ?? undefined,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? undefined,
      imageUrl: clerkUser.imageUrl ?? undefined,
    })
  }, [clerkUser, ensureUser])

  const formatSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/30">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <IconMicrophone className="size-5 text-primary" />
              </div>
              <span className="font-heading text-xl font-bold tracking-tight text-foreground">
                Captionier
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link 
                href="/app" 
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <IconLayoutDashboard className="size-4" />
                Dashboard
              </Link>
              <Link 
                href="/app/new" 
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <IconPlus className="size-4" />
                New Caption
              </Link>
              <Link
                href="/app/billing"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <IconCreditCard className="size-4" />
                Billing
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary/80 transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <IconShieldCog className="size-4" />
                  Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {usage && (
              <Link href="/app/billing" className="hidden sm:flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 text-sm font-medium text-primary shadow-[0_0_10px_rgba(255,180,60,0.1)]">
                <IconCreditCard className="size-4" />
                <span>{formatSeconds(usage.availableSeconds)} left</span>
              </Link>
            )}
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Captionier
          </p>
          <nav className="flex items-center gap-5">
            <Link
              href="/contact"
              className="text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              Contact Us
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/refunds"
              className="text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              Refunds & Cancellations
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
