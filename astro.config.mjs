// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://rasslab.dev',
  build: {
    // Keep styles in external files so the CSP can stay 'self'-only for styles.
    inlineStylesheets: 'never',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Never inline small scripts: the CSP allows only 'self' plus the one
      // hashed boot script in Base.astro.
      assetsInlineLimit: 0,
    },
  },
});
