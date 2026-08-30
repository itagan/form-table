<script setup lang="ts">
import { exampleGroups, levelLabels } from '../exampleCatalog'

const docsSiteUrl = import.meta.env.VITE_DOCS_SITE_URL
  || import.meta.env.VITE_SITE_BASE
  || 'http://localhost:5174/'
const architectureUrl = `${docsSiteUrl.replace(/\/+$/, '')}/architecture/overview`
</script>

<template>
  <main class="playground-home">
    <section class="home-hero">
      <div>
        <p class="eyebrow">FormTable Playground</p>
        <h1>FormTable 示例中心</h1>
        <p class="hero-copy">
          按开发任务选择可运行示例：布局归布局，组件归组件，业务数据操作由调用方维护。
        </p>
      </div>
      <div class="hero-actions">
        <router-link to="/form-table">
          <el-button type="primary">打开基础示例</el-button>
        </router-link>
        <a :href="architectureUrl">
          <el-button>理解组件架构</el-button>
        </a>
      </div>
    </section>

    <section
      v-for="group in exampleGroups"
      :key="group.id"
      class="example-group"
    >
      <header class="group-heading">
        <h2>{{ group.title }}</h2>
        <p>{{ group.description }}</p>
      </header>
      <div class="example-grid">
        <router-link
          v-for="example in group.examples"
          :key="example.path"
          :to="example.path"
          class="example-card"
        >
          <div class="card-header">
            <h3>{{ example.title }}</h3>
            <el-tag :type="example.type" size="mini">{{ levelLabels[example.level] }}</el-tag>
          </div>
          <p>{{ example.description }}</p>
          <div class="tag-list">
            <span v-for="tag in example.tags" :key="tag">{{ tag }}</span>
          </div>
        </router-link>
      </div>
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

.example-group {
  max-width: 1120px;
  margin: 30px auto 0;
}

.group-heading {
  margin-bottom: 14px;
}

.group-heading h2 {
  margin: 0;
  color: #111827;
  font-size: 22px;
}

.group-heading p {
  margin: 6px 0 0;
  color: #64748b;
}

.example-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
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

.example-card h3 {
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
