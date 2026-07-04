<template>
  <div class="form-table-docs">
    <div class="docs-header">
      <div>
        <h1>FormTable 能力文档</h1>
        <p>
          FormTable 以 Element UI Form / Table 为基础，补充表格内表单的数据更新、
          校验、插槽和行操作能力。
        </p>
      </div>
      <el-button type="primary" plain @click="$router.push('/form-table-advanced')">
        查看高级示例
      </el-button>
    </div>

    <section class="docs-section">
      <h2>能力矩阵</h2>
      <el-table :data="capabilities" border>
        <el-table-column prop="name" label="能力" width="180" />
        <el-table-column prop="usage" label="使用方式" min-width="260" />
        <el-table-column prop="description" label="说明" min-width="320" />
      </el-table>
    </section>

    <section class="docs-section">
      <h2>使用边界</h2>
      <el-table :data="boundaries" border>
        <el-table-column prop="scene" label="场景" width="180" />
        <el-table-column prop="recommendation" label="推荐方式" min-width="260" />
        <el-table-column prop="note" label="说明" min-width="320" />
      </el-table>
    </section>

    <section class="docs-section">
      <h2>常用配置</h2>
      <div class="snippet-grid">
        <div
          v-for="snippet in snippets"
          :key="snippet.title"
          class="snippet"
        >
          <h3>{{ snippet.title }}</h3>
          <pre><code>{{ snippet.code }}</code></pre>
        </div>
      </div>
    </section>

    <section class="docs-section">
      <h2>事件和 ref</h2>
      <div class="plain-list">
        <p>
          具体事件推荐直接监听同名事件，例如 <code>@row-click</code>、
          <code>@selection-change</code>、<code>@sort-change</code>。
        </p>
        <p>
          <code>@event</code> 适合做日志、埋点或统一调试归档，其中 Table 事件会压缩
          DOM Event、HTMLElement 和 column 实例，避免日志过重。
        </p>
        <p>
          业务侧可通过 FormTable ref 调用常用表单和表格方法，也可以通过
          <code>getNativeFormRef()</code> / <code>getNativeTableRef()</code>
          获取原生实例。
        </p>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
const capabilities = [
  {
    name: 'FormTable props',
    usage: 'tableData / columns / rules / formData / customComponents / loading',
    description: '管理表格内表单的数据、结构、校验和扩展组件。'
  },
  {
    name: 'Element Form props',
    usage: '顶层 attrs: label-width / size / disabled 等',
    description: '通过白名单透传给内部 el-form。'
  },
  {
    name: 'Element Table props',
    usage: '顶层 attrs: border / stripe / height / max-height 等',
    description: '通过白名单透传给内部 el-table。'
  },
  {
    name: 'Element Table events',
    usage: '@row-click / @selection-change / @sort-change 等',
    description: '直接同名透出，具名事件参数保持 Element UI 原生格式。'
  },
  {
    name: 'Element Column props',
    usage: 'column.props: width / align / type / renderHeader 等',
    description: '透传给 el-table-column；type=index/selection/expand 使用原生列渲染。'
  },
  {
    name: 'FormTable 扩展能力',
    usage: '字段 slot / headerSlot / required / 行操作 / 显隐 / 联动',
    description: '补足表格内表单场景中 Element UI 原生 API 不直接覆盖的部分。'
  }
]

const boundaries = [
  {
    scene: '表格样式和交互',
    recommendation: '优先使用 Element Table props/events/methods',
    note: '例如排序、筛选、选择、行点击、doLayout 都尽量走原生能力。'
  },
  {
    scene: '列配置',
    recommendation: '优先使用 column.props',
    note: '宽度、对齐、索引列、renderHeader 等都透传给 el-table-column。'
  },
  {
    scene: '表格内编辑',
    recommendation: '使用 FormTable 的字段配置和 slot 上下文',
    note: '通过 setValue/updateRow 进入统一更新链路，保留校验、联动和事件。'
  },
  {
    scene: '表头简单标记',
    recommendation: '使用 required',
    note: '只展示表头必填标识，不自动生成校验规则。'
  },
  {
    scene: '表头模板内容',
    recommendation: '使用 headerSlot',
    note: '适合团队不习惯 render 函数时，用模板方式自定义表头。'
  }
]

const snippets = [
  {
    title: '索引列',
    code: `{
  name: '序号',
  props: {
    type: 'index',
    width: '70px',
    align: 'center',
    index: (index) => index + 1
  },
  children: []
}`
  },
  {
    title: '表头插槽',
    code: `{
  name: '基本信息',
  required: true,
  headerSlot: 'basic-info-header',
  children: []
}

<template #basic-info-header="{ label, required }">
  <span v-if="required">*</span>
  <span>{{ label }}</span>
</template>`
  },
  {
    title: '原生 renderHeader',
    code: `{
  name: '联系方式',
  props: {
    renderHeader: (h, { column }) => h('span', [
      h('span', column.label),
      h('i', { class: 'el-icon-question' })
    ])
  },
  children: []
}`
  },
  {
    title: 'ref 调用',
    code: `const formTableRef = ref<FormTableExpose>()

await formTableRef.value?.validate()
formTableRef.value?.doLayout()
formTableRef.value?.getNativeTableRef()`
  }
]
</script>

<style lang="less" scoped>
.form-table-docs {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  color: #303133;

  .docs-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 24px;

    h1 {
      margin: 0 0 10px;
      font-size: 28px;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: #606266;
      line-height: 1.7;
    }
  }

  .docs-section {
    margin-bottom: 28px;
    padding: 20px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    background: #fff;

    h2 {
      margin: 0 0 18px;
      color: #606266;
      font-size: 20px;
    }
  }

  .snippet-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .snippet {
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;

    h3 {
      margin: 0;
      padding: 12px 14px;
      background: #f5f7fa;
      color: #606266;
      font-size: 15px;
      font-weight: 600;
    }

    pre {
      margin: 0;
      padding: 14px;
      min-height: 150px;
      overflow-x: auto;
      background: #1f2933;
      color: #eef2f7;
      font-size: 12px;
      line-height: 1.6;
    }
  }

  .plain-list {
    p {
      margin: 0 0 12px;
      color: #606266;
      line-height: 1.8;
    }

    code {
      padding: 2px 5px;
      border-radius: 3px;
      background: #f5f7fa;
      color: #409eff;
    }
  }
}

@media (max-width: 768px) {
  .form-table-docs {
    padding: 12px;

    .docs-header {
      display: block;

      .el-button {
        margin-top: 16px;
      }
    }

    .snippet-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
