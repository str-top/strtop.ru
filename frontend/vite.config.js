import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../dist',  // Ensure this points to the correct directory
    emptyOutDir: true,  // Clears the directory before building
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')  // Explicit input file
      }
    }
  },
  server: {
    proxy: {
      '^/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
