import crypto from "crypto"

const CASHFREE_API_VERSION = "2023-08-01"

function getBaseUrl() {
  return process.env.CASHFREE_ENV === "PRODUCTION"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg"
}

function getCredentials() {
  const appId = process.env.CASHFREE_APP_ID
  const secretKey = process.env.CASHFREE_SECRET_KEY

  if (!appId || !secretKey) {
    throw new Error("Missing Cashfree credentials in environment.")
  }

  return { appId, secretKey }
}

export async function createCashfreeOrder(params: {
  orderId: string
  amountRupees: number
  customerId: string
  customerEmail?: string
  returnUrl: string
}) {
  const { appId, secretKey } = getCredentials()

  const response = await fetch(`${getBaseUrl()}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": appId,
      "x-client-secret": secretKey,
      "x-api-version": CASHFREE_API_VERSION,
    },
    body: JSON.stringify({
      order_id: params.orderId,
      order_amount: params.amountRupees,
      order_currency: "INR",
      customer_details: {
        customer_id: params.customerId,
        customer_email: params.customerEmail ?? "test@example.com",
        customer_phone: "9999999999",
      },
      order_meta: {
        return_url: params.returnUrl,
      },
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.message ?? "Failed to create Cashfree order.")
  }

  return data as { order_id: string; payment_session_id: string }
}

export function verifyCashfreeWebhookSignature(params: {
  rawBody: string
  timestamp: string
  signature: string
}) {
  const { secretKey } = getCredentials()

  const expected = crypto
    .createHmac("sha256", secretKey)
    .update(params.timestamp + params.rawBody)
    .digest("base64")

  return expected === params.signature
}
