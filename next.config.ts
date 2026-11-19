import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // WhatsApp (Baileys) runs inside the Node.js server; load these with plain
  // Node require instead of bundling them.
  serverExternalPackages: ["baileys", "pino", "qrcode"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
