"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import {
  IconMicrophone,
  IconLayoutDashboard,
  IconUsers,
  IconArrowLeft,
} from "@tabler/icons-react"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: IconLayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: IconUsers, exact: false },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-border/50 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center gap-2.5 border-b border-border/50 px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <IconMicrophone className="size-5 text-primary" />
        </div>
        <div>
          <p className="font-heading text-sm font-bold leading-none text-foreground">
            Captionier
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border/50 p-3 space-y-1">
        <Link
          href="/app"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <IconArrowLeft className="size-4" />
          Back to App
        </Link>
        <div className="flex items-center gap-2.5 px-3 py-2">
          <UserButton />
          <span className="text-sm text-muted-foreground">Account</span>
        </div>
      </div>
    </aside>
  )
}
