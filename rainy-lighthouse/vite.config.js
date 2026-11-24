import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: {
    // WebGPU + TSL 需要较新的语法（顶层 await 等）
    target: 'esnext',
    sourcemap: true,
    chunkSizeWarningLimit: 1200
  }
});
