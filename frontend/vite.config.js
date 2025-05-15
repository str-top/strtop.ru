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
    // Increase server body size limit
    bodySizeLimit: '50mb',
    proxy: {
      '^/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        timeout: 30000, // 30 seconds
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          // Increase payload size limit for proxy
          proxy.on('proxyReq', function(proxyReq, req, _res) {
            if (req.body) {
              const bodyData = JSON.stringify(req.body);
              proxyReq.setHeader('Content-Type', 'application/json');
              proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
              proxyReq.setHeader('Connection', 'keep-alive');
              proxyReq.write(bodyData);
            }
          });
        }
      }
    }
  }
})
