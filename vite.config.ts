import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./", //This ensures relative paths for chrome extensions, because absolute paths don't work with chrome extensions
  build: {
    //Allows us to load the extension on chrome.
    outDir: "dist",
    assetsDir: "assets",
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "./index.html"), //entrypoints
        popup: path.resolve(__dirname, "./src/popup.html"), //small window in the tool bar to manage quick settings
        background: path.resolve(__dirname, "public/background.ts"), //background service worker
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Don't hash the background script
          if (chunkInfo.name === 'background') {
            return 'background.js'
          }
          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Don't hash icon files
          if (assetInfo.name && assetInfo.name.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
            return 'assets/[name].[ext]'
          }

          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name].[ext]';
          }
          return 'assets/[name]-[hash].[ext]'
        }
      }
    },
    // Ensure static assets are copied
    copyPublicDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
