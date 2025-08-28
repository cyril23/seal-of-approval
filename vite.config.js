import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    open: (() => {
      // Check for VITE_NO_OPEN to disable opening altogether
      if (process.env.VITE_NO_OPEN) return false;
      
      // Check for BROWSER environment variable to open specific browser
      if (process.env.BROWSER === 'safari') {
        // On macOS, return the Safari app path for Vite to open
        return '/Applications/Safari.app';
      }
      
      // Default behavior - open default browser
      return true;
    })()
  }
});