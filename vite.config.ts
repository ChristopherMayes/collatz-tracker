import { defineConfig } from 'vite';

// Relative asset paths so the build works under /collatz-tracker/ on GitHub Pages.
export default defineConfig({
  base: './',
});
