import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import vue2 from '@vitejs/plugin-vue2'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isSiteBuild = mode === 'site'

  return {
    base: isSiteBuild ? '/playground/' : '/',
    plugins: [
      vue2(),
      legacy({
        targets: ['ie >= 11'],
        additionalLegacyPolyfills: ['regenerator-runtime/runtime']
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@itagan/form-table': fileURLToPath(new URL('../packages/form-table/src/index.ts', import.meta.url))
      }
    },
    build: {
      ...(isSiteBuild
        ? {
            outDir: fileURLToPath(new URL('../docs/.vitepress/dist/playground', import.meta.url)),
            emptyOutDir: true
          }
        : {}),
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // CommonJS 运行时同时被 Vue 与 Element UI 使用。固定到基础依赖分包，
            // 避免 Rollup 将它归入 Element UI 后形成 element-ui <-> vue-vendor 循环依赖。
            if (id.includes('commonjsHelpers')) {
              return 'vue-vendor'
            }

            if (id.includes('/node_modules/vue/') || id.includes('/node_modules/vue-router/')) {
              return 'vue-vendor'
            }

            if (id.includes('/node_modules/element-ui/')) {
              return 'element-ui'
            }
          }
        }
      }
    }
  }
})
