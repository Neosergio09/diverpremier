// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // 🌐 Dominio de producción para SEO, Canonical URLs y Sitemap
  site: process.env.PUBLIC_SITE_URL || 'https://diverpremier.com',

  // 🚀 CRUCIAL: Esto le dice a Astro que el búnker es dinámico
  output: 'server',

  // ⚡ Prefetching global para transiciones instantáneas entre páginas
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  // 🛠️ Adaptador oficial para que Vercel entienda el código del servidor
  adapter: vercel(),

  image: {
    domains: ['placehold.co', 'images.unsplash.com', 'upload.wikimedia.org', 'kzzpbxgsffmeyvckdmhs.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  vite: {
    plugins: [tailwindcss()],
  },
});