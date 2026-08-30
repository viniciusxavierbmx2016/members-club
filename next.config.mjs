/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@tiptap/react', '@tiptap/starter-kit', 'recharts'],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          // HSTS: bare host only (no includeSubDomains — the header is served on
          // every host incl. per-workspace client custom domains, and we must
          // not force HTTPS onto subdomains of domains we don't control; no
          // preload — that's irreversible). max-age 30d for the initial rollout,
          // ramp to 1y once confirmed stable.
          {
            key: "Strict-Transport-Security",
            value: "max-age=2592000",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // SONDA-TURNSTILE — REMOVER (E4.4 etapa 5): + https://challenges.cloudflare.com
              // Liberação MÍNIMA e deliberada: só script-src e frame-src, que a leitura
              // dá como CERTOS. `connect-src` fica de FORA de propósito — é exatamente
              // o que a sonda vai medir. Se o Turnstile fizer XHR da página-mãe, a
              // violação vai aparecer na tabela da /w/{slug}/turnstile-teste, e aí a
              // cicatriz do Vimeo (BUG E, 5e78edd) terá se repetido com outro fornecedor.
              // ⚠️ static.cloudflareinsights.com NÃO cobre isto: são domínios diferentes.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://player.vimeo.com https://player.pandavideo.com.br https://static.cloudflareinsights.com https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
              "font-src 'self' data: https://fonts.gstatic.com",
              // Vimeo: the SDK fetches vimeo.com/api/oembed.json via XHR BEFORE the iframe exists — that's connect-src, not frame-src.
              // The apex is mandatory: the wildcard doesn't match a bare domain, and the SDK deliberately strips the "player." prefix.
              "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://vimeo.com https://*.vimeo.com",
              "media-src 'self' https://*.youtube.com https://*.vimeo.com https://*.tv.pandavideo.com.br",
              // SONDA-TURNSTILE — REMOVER: + https://challenges.cloudflare.com (o widget é um iframe)
              "frame-src 'self' https://*.youtube.com https://*.vimeo.com https://*.stripe.com https://www.youtube-nocookie.com https://*.tv.pandavideo.com.br https://*.pandavideo.com.br https://challenges.cloudflare.com",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
