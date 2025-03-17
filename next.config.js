/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    }
    return config
  },
  images: {
    domains: ['lh3.googleusercontent.com'], // Google resimleri için
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ]
  },
  // PDF worker için static serving
  async rewrites() {
    return [
      {
        source: '/pdf-worker/:path*',
        destination: '/pdf-worker/:path*',
      },
    ]
  }
}

module.exports = nextConfig 