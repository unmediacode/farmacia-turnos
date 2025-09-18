import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [
    tailwind({
      applyBaseStyles: true
    })
  ],
  compressHTML: true,
  prefetch: {
    defaultStrategy: 'viewport'
  },
  server: {
    host: true,
    port: 4321,
    strictPort: true
  },
  vite: {
    ssr: {
      external: ['@libsql/client']
    },
    build: {
      target: 'es2022'
    }
  }
});
