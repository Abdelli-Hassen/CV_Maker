import { defineConfig } from 'vite';
import injectHTML from 'vite-plugin-html-inject';

export default defineConfig({
  plugins: [injectHTML()],
  base: './',
  server: {
    port: 3000,
    open: true
  }
});
