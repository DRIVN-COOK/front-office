// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'   // ⬅️ manquait
import dotenv from 'dotenv'

dotenv.config({ path: '../infra/.env' })

export default defineConfig(() => {
  const port = Number(process.env.PORT_FRONT || 5173)
  const apiPort = Number(process.env.PORT_API || 3000)

  return {
    plugins: [
      react(),
      tailwindcss(), 
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
      // preserveSymlinks: true,
    },
    base: '/',
    server: {
      port,
      fs: { allow: ['..'] },
      proxy: {
        '/api': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
      },
    },
    optimizeDeps: {
      // include/exclude si besoin
    },
  }
})
