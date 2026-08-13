import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Node loads this file as ESM, where __dirname does not exist. Without an
    // explicit root, the stray ~/projects/package-lock.json makes Turbopack
    // infer ~/projects as the workspace root and watch every sibling project.
    root: import.meta.dirname,
  },
};

export default nextConfig;
