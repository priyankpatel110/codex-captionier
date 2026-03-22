/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@ffmpeg-installer/ffmpeg",
    "@ffmpeg-installer/win32-x64",
    "fluent-ffmpeg",
  ],
}

export default nextConfig
