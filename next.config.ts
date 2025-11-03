import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Ukloni webpack konfiguraciju za sada
  experimental: {
    esmExternals: true
  }
}

export default nextConfig