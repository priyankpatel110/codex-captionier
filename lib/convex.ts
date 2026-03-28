import { auth } from "@clerk/nextjs/server"
import { ConvexHttpClient } from "convex/browser"

export async function createAuthedConvexClient() {
  const authState = await auth()

  if (!authState.userId) {
    return null
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

  if (!convexUrl) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL in your environment.")
  }

  const token = await authState.getToken({ template: "convex" })

  if (!token) {
    throw new Error(
      "Missing Clerk Convex token. Create a Clerk JWT template named `convex`."
    )
  }

  const client = new ConvexHttpClient(convexUrl)
  client.setAuth(token)

  return {
    client,
    userId: authState.userId,
  }
}
