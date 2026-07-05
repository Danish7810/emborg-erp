const fs = require('fs');
const path = require('path');

const config = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: [
          // Prevents clickjacking — stops your site being embedded in iframes
          { key: "X-Frame-Options", value: "SAMEORIGIN" },

          // Stops browsers MIME-sniffing — prevents content-type attacks
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Controls how much referrer info is sent when navigating away
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Restricts which browser features/APIs pages can use
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },

          // Content Security Policy — whitelists approved content sources
          // Prevents XSS attacks by blocking unexpected scripts/styles
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js needs unsafe-inline for its inline scripts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://cdn.tawk.to https://embed.tawk.to",
              // Styles: self + inline (Next.js injects inline styles)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + data URIs (for inline SVGs) + supabase storage
              "img-src 'self' data: blob: https://*.supabase.co https://www.google.com",
              // API calls: self + Supabase + Anthropic + Razorpay + Resend + Tawk
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.razorpay.com https://api.resend.com https://va.vercel-scripts.com https://*.tawk.to wss://*.tawk.to",
              // Frames: Razorpay payment iframe + Calendly
              "frame-src 'self' https://api.razorpay.com https://calendly.com https://*.tawk.to",
              // Workers: self + blob (for service worker)
              "worker-src 'self' blob:",
              // Manifests
              "manifest-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
`;

fs.writeFileSync(path.join('C:\\Users\\Danish\\emborg', 'next.config.ts'), config, { encoding: 'utf8' });
console.log('✅ next.config.ts: all 5 security headers added');
console.log('   X-Frame-Options: SAMEORIGIN');
console.log('   X-Content-Type-Options: nosniff');
console.log('   Referrer-Policy: strict-origin-when-cross-origin');
console.log('   Permissions-Policy: camera/mic/geo/cohort disabled');
console.log('   Content-Security-Policy: full whitelist');
console.log('');
console.log('Run: npm run build');
