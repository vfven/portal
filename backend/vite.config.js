import { defineConfig } from 'vite';

// Versión inyectada en build time para la marca de agua.
// - APP_BUILD      → número consecutivo del pipeline (BITBUCKET_BUILD_NUMBER).
// - APP_BUILD_DATE → fecha UTC del build (YYYY-MM-DD).
// Fallback 'local' + fecha actual cuando se construye fuera del CI.
const APP_BUILD      = process.env.APP_BUILD || 'local';
const APP_BUILD_DATE = (process.env.APP_BUILD_DATE && process.env.APP_BUILD_DATE !== 'local')
  ? process.env.APP_BUILD_DATE
  : new Date().toISOString().slice(0, 10);

// Config Vite para el DevOps Portal.
// - root: raíz del repo (index.html está en la raíz).
// - build.outDir: dist/ (el Dockerfile multi-stage lo copia a nginx).
// - server.proxy: en dev local el fetch '/api/*' se redirige al backend.
export default defineConfig({
  define: {
    __APP_BUILD__:      JSON.stringify(APP_BUILD),
    __APP_BUILD_DATE__: JSON.stringify(APP_BUILD_DATE),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
