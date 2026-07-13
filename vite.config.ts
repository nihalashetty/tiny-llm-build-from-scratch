import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' keeps all asset URLs relative, so the built site works no matter
// what sub-path GitHub Pages serves it from (e.g. https://user.github.io/repo/).
// Combined with HashRouter, this means zero 404s on refresh and no config churn
// when the repo is renamed.
export default defineConfig({
  base: './',
  plugins: [react()],
  worker: {
    format: 'es',
  },
});
