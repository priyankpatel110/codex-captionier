import { AppLayout } from "@/components/app-layout"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function PrivilegedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  return <AppLayout>{children}</AppLayout>
}
