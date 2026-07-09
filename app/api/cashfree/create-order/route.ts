import { NextResponse } from "next/server"

import { api } from "@/convex/_generated/api"
import { createCashfreeOrder } from "@/lib/cashfree"
import { createAuthedConvexClient } from "@/lib/convex"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const convexClient = await createAuthedConvexClient()

  if (!convexClient) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const packageId = typeof body?.packageId === "string" ? body.packageId : null

  if (!packageId) {
    return NextResponse.json({ error: "Missing packageId." }, { status: 400 })
  }

  try {
    const pkg = await convexClient.client.query(api.payments.getPackage, {
      packageId,
    })

    const orderId = `order_${crypto.randomUUID().replace(/-/g, "")}`
    const origin = new URL(request.url).origin

    const order = await createCashfreeOrder({
      orderId,
      amountRupees: pkg.amountRupees,
      customerId: convexClient.userId,
      returnUrl: `${origin}/app/billing?order_id=${orderId}`,
    })

    await convexClient.client.mutation(api.payments.createPendingPayment, {
      orderId,
      packageId,
    })

    return NextResponse.json({
      orderId,
      paymentSessionId: order.payment_session_id,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create order.",
      },
      { status: 500 }
    )
  }
}
