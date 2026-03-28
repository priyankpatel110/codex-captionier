import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Manrope, Playfair_Display } from "next/font/google"

import { ConvexClientProvider } from "@/components/convex-client-provider"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const fontManrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
})

export const metadata: Metadata = {
  title: "Captionier",
  description:
    "Generate synced SRT captions for Indian language audio with Saaras v3.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased font-sans",
        fontManrope.variable,
        playfairDisplay.variable,
        "bg-black text-white selection:bg-amber-500/30 dark"
      )}
    >
      <body>
        <ClerkProvider>
          <ConvexClientProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
