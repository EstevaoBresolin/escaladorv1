/** @type {import('next').NextConfig} */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  turbopack: {
    root: projectRoot,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Otimizações de performance
  experimental: {
    optimizePackageImports: ["lucide-react", "@supabase/supabase-js"],
  },
  // Configuração de cache
  onDemandEntries: {
    // Período em ms que uma página fica em cache após ser acessada
    maxInactiveAge: 60 * 1000, // 1 minuto
    // Número de páginas que devem ser mantidas simultaneamente
    pagesBufferLength: 5,
  },
};

export default nextConfig;
