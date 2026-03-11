/** @type {import('next').Config} */
const nextConfig = {
  async rewrites() {
    const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
    const backendFromPublicApi = publicApiUrl
      ? publicApiUrl.replace(/\/api\/?$/, '')
      : null;
    const backendUrl = process.env.BACKEND_URL || backendFromPublicApi || 'http://localhost:8080';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
