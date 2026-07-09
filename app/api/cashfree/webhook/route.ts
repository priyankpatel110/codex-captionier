import { NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"

import { api } from "@/convex/_generated/api"
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-webhook-signature") ?? ""
  const timestamp = request.headers.get("x-webhook-timestamp") ?? ""

  const isValid = verifyCashfreeWebhookSignature({
    rawBody,
    timestamp,
    signature,
  })

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  const orderId = payload?.data?.order?.order_id as string | undefined
  const eventType = payload?.type as string | undefined

  if (!orderId) {
    return NextResponse.json({ error: "Missing order id." }, { status: 400 })
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  const webhookSecret = process.env.CONVEX_WEBHOOK_SECRET

  if (!convexUrl || !webhookSecret) {
    throw new Error("Missing Convex webhook configuration.")
  }

  const client = new ConvexHttpClient(convexUrl)

  if (eventType === "PAYMENT_SUCCESS_WEBHOOK") {
    await client.mutation(api.payments.markPaymentPaid, {
      orderId,
      webhookSecret,
    })
  } else if (
    eventType === "PAYMENT_FAILED_WEBHOOK" ||
    eventType === "PAYMENT_USER_DROPPED_WEBHOOK"
  ) {
    await client.mutation(api.payments.markPaymentFailed, {
      orderId,
      webhookSecret,
    })
  }

  return NextResponse.json({ received: true })
}
