<script setup lang="ts">
// 可通过环境变量覆盖部署后的文档地址；本地开发默认使用固定的 VitePress 端口。
const docsSiteUrl = import.meta.env.VITE_DOCS_SITE_URL || 'http://localhost:5174/'
</script>

<template>
  <div id="app">
    <nav class="cross-site-nav" aria-label="站点切换">
      <router-link v-if="$route.path !== '/'" to="/">示例中心</router-link>
      <a :href="docsSiteUrl" class="docs-site-link">← 返回文档总站</a>
    </nav>
    <router-view />
  </div>
</template>

<style scoped>
.cross-site-nav {
  position: fixed;
  top: 14px;
  right: 20px;
  z-index: 2000;
  display: flex;
  gap: 14px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #dfe5ef;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
}

.cross-site-nav a {
  color: #2563eb;
  font-size: 13px;
  font-weight: 600;
}

.cross-site-nav .docs-site-link {
  color: #047857;
}

@media (max-width: 760px) {
  .cross-site-nav {
    position: static;
    justify-content: flex-end;
    margin: 12px 20px 0;
  }
}
</style>
