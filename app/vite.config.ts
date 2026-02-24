import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // 生产构建优化
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    // Chunk 分割策略 — 减小首屏加载体积
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心
          'vendor-react': ['react', 'react-dom'],
          // UI 组件库（Radix）
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
          ],
          // 图表库（较大，单独分包）
          'vendor-charts': ['recharts'],
          // 动画库
          'vendor-motion': ['framer-motion'],
          // 日期处理
          'vendor-date': ['date-fns', 'react-day-picker'],
          // Supabase SDK
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    // 单 chunk 警告阈值
    chunkSizeWarningLimit: 500,
  },
});
