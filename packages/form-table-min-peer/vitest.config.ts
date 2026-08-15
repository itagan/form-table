import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: [{
      find: /^vue$/,
      replacement: fileURLToPath(new URL('./node_modules/vue/dist/vue.runtime.esm.js', import.meta.url))
    }]
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setup.ts']
  }
})
