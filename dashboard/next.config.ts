import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Tailscale serve/funnel hostname for dev over the tailnet.
  allowedDevOrigins: ["safis-macbook-pro.tail0b6830.ts.net"],
}

export default nextConfig
