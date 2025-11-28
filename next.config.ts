import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['@genkit-ai/core', '@genkit-ai/flow', '@genkit-ai/googleai'],
};

export default nextConfig;
