import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. A package-lock.json also exists in
  // the parent bubu-workspace folder, which otherwise makes Next infer the
  // wrong root and emit a multiple-lockfiles warning.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
