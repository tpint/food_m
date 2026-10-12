import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { buildDefines, versionFile } from './build-info';

export default defineConfig({
  base: './',
  define: buildDefines,
  plugins: [versionFile()],
  build: {
    rollupOptions: { input: { main: resolve(__dirname, 'index.html'), gallery: resolve(__dirname, 'gallery.html') } },
  },
});
