import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminAuthGate } from "@/components/admin-auth-gate"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  const adminIds = (process.env.ADMIN_CLERK_USER_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0)

  if (!userId || !adminIds.includes(userId)) {
    redirect("/app")
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <AdminAuthGate>{children}</AdminAuthGate>
      </main>
    </div>
  )
}
