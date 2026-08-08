<script setup lang="ts">
const examples = [
  {
    title: '基础编辑',
    description: '统一 children 布局的基础编辑、字段组件和 Element UI 校验。',
    path: '/form-table',
    type: 'primary',
    tags: ['children', 'type', 'formItemProps']
  },
  {
    title: '高级示例',
    description: '集中演示多行栅格、直接组件、动态 options、嵌套路径和 slot。',
    path: '/form-table-advanced',
    type: 'success',
    tags: ['slot', 'component.renderer', 'dynamic']
  },
  {
    title: '动态插槽',
    description: '验证动态显隐、字段上下文和 slot 更新助手。',
    path: '/dynamic-slot-test',
    type: 'warning',
    tags: ['visible', 'slot props', 'setValue']
  },
  {
    title: '远程 Schema',
    description: '演示纯 JSON 布局如何在页面本地绑定组件、事件和 slot。',
    path: '/remote-schema',
    type: 'success',
    tags: ['JSON', 'local enhance', 'registry-free']
  },
  {
    title: '企业复杂组件接入',
    description: '实际演示全局内部组件、局部业务组件、非标准绑定协议和复杂事件联动。',
    path: '/enterprise-components',
    type: 'primary',
    tags: ['custom model', 'global component', 'business component']
  },
  {
    title: '行列操作与延迟提交',
    description: '演示行增删复制移动、动态列，以及业务检查成功后才写入字段。',
    path: '/row-column-operations',
    type: 'warning',
    tags: ['row operations', 'columns', 'delayed commit']
  },
  {
    title: '单元格合并',
    description: '演示分组纵向合并、汇总行横向合并、稳定列定位和表头隐藏。',
    path: '/cell-merge',
    type: 'primary',
    tags: ['spanMethod', 'rowspan', 'colspan']
  },
  {
    title: '能力文档',
    description: '在调试应用内查看 props、事件、ref 方法和推荐配置约定。',
    path: '/form-table-docs',
    type: 'info',
    tags: ['API', 'guide', 'examples']
  },
  {
    title: '组件调试',
    description: '用于验证自定义组件对象直传、事件和原生 Ref。',
    path: '/debug',
    type: 'danger',
    tags: ['debug', 'component.renderer', 'native ref']
  }
]
</script>

<template>
  <main class="playground-home">
    <section class="home-hero">
      <div>
        <p class="eyebrow">FormTable Playground</p>
        <h1>表格内表单组件调试台</h1>
        <p class="hero-copy">
          这里验证精简后的 FormTable：布局归布局，组件归组件，业务数据操作由调用方维护。
        </p>
      </div>
      <div class="hero-actions">
        <router-link to="/form-table">
          <el-button type="primary">打开基础示例</el-button>
        </router-link>
        <router-link to="/form-table-docs">
          <el-button>查看能力文档</el-button>
        </router-link>
      </div>
    </section>

    <section class="example-grid">
      <router-link
        v-for="example in examples"
        :key="example.path"
        :to="example.path"
        class="example-card"
      >
        <div class="card-header">
          <h2>{{ example.title }}</h2>
          <el-tag :type="example.type" size="mini">示例</el-tag>
        </div>
        <p>{{ example.description }}</p>
        <div class="tag-list">
          <span v-for="tag in example.tags" :key="tag">{{ tag }}</span>
        </div>
      </router-link>
    </section>
  </main>
</template>

<style scoped>
.playground-home {
  min-height: 100vh;
  padding: 32px;
}

.home-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  max-width: 1120px;
  margin: 0 auto 24px;
  padding: 28px 0;
  border-bottom: 1px solid #d8dee9;
}

.eyebrow {
  margin: 0 0 8px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #111827;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}

.hero-copy {
  max-width: 680px;
  margin: 14px 0 0;
  color: #4b5563;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.example-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  max-width: 1120px;
  margin: 0 auto;
}

.example-card {
  display: block;
  min-height: 178px;
  padding: 20px;
  color: inherit;
  background: #ffffff;
  border: 1px solid #dfe5ef;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.example-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

h2 {
  margin: 0;
  color: #111827;
  font-size: 18px;
  font-weight: 700;
}

.example-card p {
  margin: 14px 0 18px;
  color: #4b5563;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-list span {
  padding: 3px 8px;
  color: #374151;
  background: #eef2f7;
  border-radius: 4px;
  font-size: 12px;
}

@media (max-width: 760px) {
  .playground-home {
    padding: 20px;
  }

  .home-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  h1 {
    font-size: 26px;
  }
}
</style>
