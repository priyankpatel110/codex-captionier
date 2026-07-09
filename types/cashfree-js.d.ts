declare module "@cashfreepayments/cashfree-js" {
  export interface Cashfree {
    checkout(options: {
      paymentSessionId: string
      redirectTarget?: "_self" | "_blank" | "_modal" | HTMLElement
    }): Promise<{ error?: unknown; redirect?: boolean; paymentDetails?: unknown }>
  }

  export function load(options: {
    mode: "sandbox" | "production"
  }): Promise<Cashfree>
}
