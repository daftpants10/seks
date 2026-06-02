/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'chokidar', 'music-tempo'],
  },
};

module.exports = nextConfig;
