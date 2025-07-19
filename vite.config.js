import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  // 配置 GitHub Pages 的 base URL
  // 使用自定义域名 another-life.aznablemiao.com 时，部署在根路径下
  // 所以 base 设置为 '/'
  base: '/',
}))
