/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    proxyClientMaxBodySize: 500 * 1024 * 1024,
  },
  serverExternalPackages: [
    "@ffmpeg-installer/ffmpeg",
    "@ffmpeg-installer/win32-x64",
    "fluent-ffmpeg",
  ],
}

export default nextConfig
