"use client"

import { useConvexAuth } from "convex/react"
import { IconLoader2 } from "@tabler/icons-react"
import type { ReactNode } from "react"

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth()

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
