# FormTable NPM 包开发指南

## 一、目标

将 `src/components/FormTable/` 目录下的组件抽离为独立 npm 包，支持：

- Vue 2.7 + Element UI 2.x
- ESM / CJS 双格式输出
- TypeScript 类型声明
- 样式内联或独立导出
- 开发时支持 demo 预览（当前项目改造为 playground）

---

## 二、目录结构改造

```
FormTable/
├── packages/
│   └── form-table/                    # npm 包源码
│       ├── package.json               # 包配置
│       ├── tsconfig.json              # TS 配置
│       ├── vite.config.ts             # 库模式构建配置
│       ├── src/
│       │   ├── index.ts               # 入口：导出组件 + 类型
│       │   ├── types.ts               # 类型定义（从现有迁移）
│       │   ├── index.vue              # FormTable 主组件
│       │   ├── FormTableColumn.vue
│       │   ├── FormTableItem.vue
│       │   ├── FormTableRow.vue
│       │   ├── ComponentWrapper.vue
│       │   ├── configs/
│       │   │   ├── index.ts
│       │   │   └── defaultComponentConfigs.ts
│       │   └── utils/
│       │       ├── index.ts
│       │       ├── attrs.ts
│       │       └── componentProps.ts
│       └── dist/                      # 构建产物
│           ├── index.mjs              # ESM
│           ├── index.cjs              # CJS
│           ├── style.css              # 提取的样式
│           └── types/                 # .d.ts 类型声明
│               └── ...
│
├── playground/                        # Demo / 文档站点（原 src/ 改造）
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── router/
│   │   └── views/
│   │       ├── FormTableView.vue
│   │       ├── FormTableAdvancedView.vue
│   │       └── ...
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── package.json                       # 根 monorepo 配置
├── pnpm-workspace.yaml                # pnpm workspace
└── tsconfig.base.json                 # 共享 TS 配置
```

---

## 三、核心配置文件

### 3.1 根目录 `pnpm-workspace.yaml`

```yaml
packages:
  - 'packages/*'
  - 'playground'
```

### 3.2 根目录 `package.json`

```jsonc
{
  "name": "formtable-monorepo",
  "private": true,
  "scripts": {
    "dev": "pnpm -C playground dev",
    "build": "pnpm -C packages/form-table build",
    "build:playground": "pnpm -C playground build"
  }
}
```

### 3.3 包 `packages/form-table/package.json`

```jsonc
{
  "name": "@your-scope/vue-form-table",
  "version": "1.0.0",
  "description": "Vue 2 FormTable component based on Element UI",
  "author": "your-name",
  "license": "MIT",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/types/index.d.ts"
    },
    "./style.css": "./dist/style.css"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "sideEffects": [
    "**/*.css"
  ],
  "scripts": {
    "build": "vite build && vue-tsc --declaration --emitDeclarationOnly --outDir dist/types",
    "type-check": "vue-tsc --noEmit"
  },
  "peerDependencies": {
    "vue": "^2.7.0",
    "element-ui": "^2.15.0"
  },
  "devDependencies": {
    "vue": "^2.7.7",
    "element-ui": "^2.15.14",
    "vite": "^3.0.2",
    "@vitejs/plugin-vue2": "^1.1.2",
    "typescript": "~4.7.4",
    "vue-tsc": "^0.38.8",
    "less": "^4.4.0"
  }
}
```

**关键点：**
- `vue` 和 `element-ui` 放在 `peerDependencies`，不打包进产物
- 使用 `exports` 字段提供条件导出
- `files` 只发布 `dist/`

### 3.4 包构建 `packages/form-table/vite.config.ts`

```ts
import { defineConfig } from 'vite'
import vue2 from '@vitejs/plugin-vue2'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue2()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueFormTable',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`
    },
    rollupOptions: {
      external: ['vue', 'element-ui'],
      output: {
        globals: {
          vue: 'Vue',
          'element-ui': 'ELEMENT'
        },
        // 保持模块化结构便于 tree-shaking
        preserveModules: false
      }
    },
    cssCodeSplit: false   // 样式合并为一个文件
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
```

### 3.5 包入口 `packages/form-table/src/index.ts`

```ts
// 导出主组件
export { default as FormTable } from './index.vue'

// 导出所有类型
export type {
  FormItemType,
  FormItemConfig,
  RowConfig,
  ColumnConfig,
  FormTableProps,
  FormTableEmits,
  TableRow,
  ValidationRule,
  CustomComponentConfig,
  DispatchFn,
  FormTableEventPayload
} from './types'

// 导出 provide/inject keys（高级用法）
export {
  FORM_TABLE_CUSTOM_COMPONENTS_KEY,
  FORM_TABLE_DISPATCH_KEY,
  FORM_TABLE_SLOTS_KEY
} from './types'

// 默认导出（支持 Vue.use() 注册）
export default FormTable
```

### 3.6 包 `packages/form-table/tsconfig.json`

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "outDir": "dist/types",
    "rootDir": "src",
    "declaration": true,
    "declarationDir": "dist/types",
    "emitDeclarationOnly": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "src/**/*.vue"]
}
```

---

## 四、用户使用方式

### 4.1 安装

```bash
npm install @your-scope/vue-form-table element-ui
```

### 4.2 全局注册

```ts
import Vue from 'vue'
import ElementUI from 'element-ui'
import FormTable from '@your-scope/vue-form-table'
import '@your-scope/vue-form-table/style.css'
import 'element-ui/lib/theme-chalk/index.css'

Vue.use(ElementUI)
Vue.use(FormTable)  // 或 Vue.component('FormTable', FormTable)
```

### 4.3 按需引入

```ts
import { FormTable } from '@your-scope/vue-form-table'
import '@your-scope/vue-form-table/style.css'

export default {
  components: { FormTable }
}
```

### 4.4 TypeScript 支持

```ts
import type { FormTableProps, ColumnConfig, FormItemConfig } from '@your-scope/vue-form-table'
```

---

## 五、开发流程

### 5.1 日常开发

```bash
# 启动 playground 调试
pnpm dev

# playground 中引用本地包
# playground/src/main.ts:
#   import FormTable from '@your-scope/vue-form-table'
#   import '@your-scope/vue-form-table/style.css'
```

playground 的 `vite.config.ts` 需配置别名指向包源码（支持 HMR）：

```ts
// playground/vite.config.ts
import { resolve } from 'node:path'

export default defineConfig({
  // ...
  resolve: {
    alias: {
      '@your-scope/vue-form-table': resolve(__dirname, '../packages/form-table/src/index.ts'),
      '@your-scope/vue-form-table/style.css': resolve(__dirname, '../packages/form-table/src/index.ts')
    }
  }
})
```

### 5.2 构建与发布

```bash
# 构建包
pnpm build

# 本地测试（在包目录下）
cd packages/form-table
npm pack                    # 生成 .tgz
npm install ./form-table-1.0.0.tgz  # 在其他项目测试

# 发布
npm publish --access public
```

---

## 六、注意事项

### 6.1 外部化依赖

**必须**将 `vue` 和 `element-ui` 标记为 `external`，否则：
- 包体积暴增
- 与用户项目的 Vue/Element UI 冲突，导致重复实例、事件不响应等问题

### 6.2 样式处理

当前组件使用 Less 编写样式。两种方案：

| 方案 | 做法 | 优点 | 缺点 |
|------|------|------|------|
| **提取 CSS 文件** | Vite 默认行为 | 用户可按需加载、覆盖样式 | 需单独引入 |
| **CSS-in-JS 注入** | `styleInject` 方式 | 零配置 | 无法覆盖、包体积增大 |

推荐 **提取 CSS 文件**，通过 `import '@your-scope/vue-form-table/style.css'` 引入。

### 6.3 Element UI 组件注册

组件内部使用了 `el-form`、`el-table`、`el-input` 等 Element UI 组件。用户必须在项目中全局注册 Element UI：

```ts
Vue.use(ElementUI)
```

不建议在包内部注册 Element UI（会与用户项目冲突）。

### 6.4 Vue 2 单根节点限制

当前子组件（如 `FormTableItem.vue`）的 slot 渲染已通过 `<div>` 包裹解决了 Vue 2 单根节点限制。迁移时保持现状即可，但需注意测试 slot 功能。

### 6.5 provide/inject Symbol Keys

`types.ts` 中的 Symbol keys 在包内定义即可。由于每次加载会创建新 Symbol，不影响跨项目使用——`provide` 和 `inject` 在同一组件树内使用同一个包实例，Symbol 始终一致。

### 6.6 CSS 作用域

建议为组件根元素添加统一的 CSS 前缀类名（如 `.vue-form-table`），避免样式污染。

---

## 七、发布清单

- [ ] 创建 `packages/form-table/` 目录，迁移组件源码
- [ ] 配置 `package.json`（name, version, exports, peerDependencies）
- [ ] 配置 `vite.config.ts`（lib 模式 + external）
- [ ] 编写包入口 `src/index.ts`（导出组件 + 类型）
- [ ] 配置 `tsconfig.json`（生成 .d.ts）
- [ ] 将原 `src/` 改造为 `playground/`，引用本地包
- [ ] 配置 `pnpm-workspace.yaml`
- [ ] 构建，验证 `dist/` 产物（ESM + CJS + CSS + .d.ts）
- [ ] 在 playground 中测试所有功能（基础、高级、自定义组件、slot）
- [ ] 编写 README.md（安装、用法、API 文档）
- [ ] 添加 `.npmignore`（排除 src/、测试文件等）
- [ ] `npm publish`
