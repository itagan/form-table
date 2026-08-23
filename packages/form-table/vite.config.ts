import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue2 from '@vitejs/plugin-vue2'

export default defineConfig({
  plugins: [vue2()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      all: true,
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/types.ts',
        'src/types.public.ts',
        'src/public-types.ts',
        'src/types/base.ts',
        'src/types/component.ts',
        'src/types/config.ts',
        'src/types/context.ts',
        'src/types/config/**'
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 75,
        lines: 80
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'FormTable',
      formats: ['es', 'umd'],
      fileName: (format) => (format === 'umd' ? 'formtable.umd.cjs' : 'formtable.es.js')
    },
    rollupOptions: {
      external: ['vue', 'element-ui'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          'element-ui': 'ELEMENT'
        }
      }
    }
  }
})
