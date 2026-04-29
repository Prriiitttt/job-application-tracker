import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/// <reference types="vitest" />
export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: true,
    exclude: ['node_modules', 'dist', 'e2e/**', 'playwright.config.*'],
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      VITE_GIPHY_API_KEY: 'test-giphy-key',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['e2e/**', 'src/test/**', '**/*.test.{js,jsx}'],
    },
  },
})
