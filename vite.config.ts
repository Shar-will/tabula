import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', //This ensures relative paths for chrome extensions, because absolute paths don't work with chrome extensions
  build: { //Allows us to load the extension on chrome. 
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, './index.html'), //entrypoints
        popup: path.resolve(__dirname, 'src/popup.html'), //small window in the tool bar to manage quick settings
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
