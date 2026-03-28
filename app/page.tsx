import { LandingPage } from "@/components/landing-page"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function Page() {
  const { userId } = await auth()
  
  if (userId) {
    redirect("/app")
  }

  return <LandingPage />
}
