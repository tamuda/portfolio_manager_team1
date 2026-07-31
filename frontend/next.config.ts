import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Avoid Turbopack picking ~/package-lock.json as the workspace root
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
