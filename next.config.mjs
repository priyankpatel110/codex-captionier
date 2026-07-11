/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    proxyClientMaxBodySize: 500 * 1024 * 1024,
    outputFileTracingIncludes: {
      "/api/transcribe": ["./node_modules/@ffmpeg-installer/**/*"],
      "/api/extract-audio": ["./node_modules/@ffmpeg-installer/**/*"],
    },
  },
  serverExternalPackages: ["@ffmpeg-installer/ffmpeg", "fluent-ffmpeg"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
        ],
      },
    ]
  },
}

export default nextConfig
