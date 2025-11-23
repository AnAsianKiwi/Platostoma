import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // 1. Disable sourcemaps for lighter production build (Optional)
    sourcemap: false, 
    
    // 2. Minify code
    minify: 'esbuild',
    
    // 3. INCREASE WARNING LIMIT TO 1000kB (1MB)
    chunkSizeWarningLimit: 1000, 
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});