import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin Turbopack root to this app: a stray C:\Users\USER\package-lock.json
    // makes Next infer the home dir as workspace root and hang compiling.
    root: __dirname,
  },
};

export default nextConfig;
