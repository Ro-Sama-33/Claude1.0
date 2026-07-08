import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // CV-upload (PDF/Word) gaat via een Server Action; max 10 MB + marge.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
