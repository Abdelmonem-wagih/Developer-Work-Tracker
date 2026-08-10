import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: 'csp-dev-only',
      transformIndexHtml(html) {
        if (mode === 'development') {
          return html.replace(
            '<head>',
            `<head>
    <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-eval' 'unsafe-inline';">`
          );
        }
        return html;
      }
    }
  ],
  // We removed the manual proxy to let Vercel Dev handle routing.
  // IMPORTANT: Always access the app via the port provided by "vercel dev" (usually 3000)
  // rather than the Vite port (5173/5174).
  build: {
    target: 'esnext',
    sourcemap: mode === 'development'
  }
}))
