// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // 🚀 CRUCIAL: Esto le dice a Astro que el búnker es dinámico
  output: 'server',

  // 🛠️ Adaptador oficial para que Vercel entienda el código del servidor
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
  },
});