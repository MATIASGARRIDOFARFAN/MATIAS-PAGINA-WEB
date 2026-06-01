/** @type {import('next').NextConfig} */

// Para GitHub Pages: repo "MATIAS-PAGINA-WEB" → https://usuario.github.io/MATIAS-PAGINA-WEB/
const repoName = process.env.GITHUB_PAGES_REPO ?? "MATIAS-PAGINA-WEB"
const isGithubPages = process.env.GITHUB_PAGES === "true"
const basePath = isGithubPages ? `/${repoName}` : ""

const nextConfig = {
  output: "export",
  basePath,
  assetPrefix: isGithubPages ? `${basePath}/` : undefined,
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
