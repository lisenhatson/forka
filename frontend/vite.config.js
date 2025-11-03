import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // ✅ Biar bisa import pakai "src/..." di mana saja
      src: path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173, // bisa ubah kalau bentrok
    host: 'localhost',
    open: true, // otomatis buka browser
    hmr: {
      overlay: true, // nampilin error overlay di browser
    },
  },
})
