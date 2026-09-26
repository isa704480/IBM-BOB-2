import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base '/' — Node server serves dist at root.
// assetsDir 'static' so built assets live at /static/* and never collide
// with the Node app's own /assets/* (login/register CSS + auth.js).
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    emptyOutDir: true,
  },
});
