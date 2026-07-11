import { AuthConfig } from "convex/server"

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN_PROD!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig
