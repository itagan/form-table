<script setup lang="ts">
import TheWelcome from '@/components/TheWelcome.vue'
</script>

<template>
  <main>
    <div class="home-header">
      <h1>Vue Components Demo</h1>
      <div class="nav-links">
        <router-link to="/form-table" class="nav-link">
          <el-button type="primary">FormTable 组件演示</el-button>
        </router-link>
        <router-link to="/form-table-advanced" class="nav-link">
          <el-button type="success">FormTable 高级示例</el-button>
        </router-link>
      </div>
    </div>
    <TheWelcome />
  </main>
</template>

<style scoped>
.home-header {
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-bottom: 40px;
}

.home-header h1 {
  margin-bottom: 20px;
  font-size: 2.5em;
}

.nav-links {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.nav-link {
  text-decoration: none;
}
</style>
