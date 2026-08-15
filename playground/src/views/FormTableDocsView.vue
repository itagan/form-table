<template>
  <main class="api-page">
    <router-link to="/">← 返回示例首页</router-link>

    <header class="api-hero">
      <div>
        <p class="eyebrow">FormTable API Explorer</p>
        <h1>配置路径与运行时上下文</h1>
        <p>按完整路径查找配置，按调用位置确认上下文。复杂功能进入独立演示，不在 API 表内混写教程。</p>
      </div>
      <el-input
        v-model="keyword"
        class="api-search"
        clearable
        prefix-icon="el-icon-search"
        placeholder="搜索路径、类型、目标或说明"
      />
    </header>

    <section class="feature-section">
      <div class="section-heading">
        <div>
          <h2>功能专题</h2>
          <p>跨配置层级或包含完整业务流程的能力，单独提供可运行示例。</p>
        </div>
      </div>
      <div class="feature-grid">
        <router-link v-for="feature in featureCards" :key="feature.title" :to="feature.path" class="feature-card">
          <strong>{{ feature.title }}</strong>
          <p>{{ feature.description }}</p>
          <span v-for="tag in feature.tags" :key="tag">{{ tag }}</span>
        </router-link>
      </div>
    </section>

    <section class="reference-section">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="配置路径" name="paths">
          <div class="tree-panel">
            <strong>配置树</strong>
            <code>FormTable → columns[] → formItems[] (Item) → component</code>
            <small><code>[]</code> 表示数组元素，<code>.</code> 表示对象属性；表格中的路径可直接用于定位类型和文档。</small>
          </div>

          <el-empty v-if="visibleApiGroups.length === 0" description="没有匹配的 API" />
          <article v-for="group in visibleApiGroups" :key="group.id" class="api-group">
            <div class="group-heading">
              <h2>{{ group.title }}</h2>
              <p>{{ group.description }}</p>
            </div>
            <el-table :data="group.entries" border stripe size="mini">
              <el-table-column label="完整路径" min-width="330">
                <template #default="{ row }"><code class="path-code">{{ row.path }}</code></template>
              </el-table-column>
              <el-table-column prop="type" label="类型" min-width="210" />
              <el-table-column prop="defaultValue" label="默认 / 必填" width="105" />
              <el-table-column prop="target" label="目标" min-width="180" />
              <el-table-column label="说明" min-width="280">
                <template #default="{ row }">
                  <div>{{ row.description }}</div>
                  <el-tag v-if="row.context" size="mini" type="info">{{ row.context }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </article>
        </el-tab-pane>

        <el-tab-pane label="上下文矩阵" name="contexts">
          <div class="tab-intro">
            <h2>上下文由调用位置决定</h2>
            <p>不补齐无意义的占位字段。配置对象是浅只读约定；数据更新使用 <code>setValue</code> 或 <code>updateRow</code>。</p>
          </div>
          <el-table :data="contextRows" border stripe>
            <el-table-column label="配置 / Slot 位置" min-width="330">
              <template #default="{ row }"><code>{{ row.location }}</code></template>
            </el-table-column>
            <el-table-column label="上下文类型" min-width="210">
              <template #default="{ row }"><code>{{ row.context }}</code></template>
            </el-table-column>
            <el-table-column prop="fields" label="实际字段" min-width="460" />
          </el-table>

          <div class="boundary-grid">
            <article>
              <h3>cellSlot</h3>
              <code>{ row, index, columnConfig, updateRow }</code>
              <p>整格渲染，不提供 fieldKey、value、setValue、表单校验或组件解析结果。</p>
              <router-link to="/cell-slot">打开专题演示 →</router-link>
            </article>
            <article>
              <h3>字段 Slot</h3>
              <code>ActionContext + { propPath, component }</code>
              <p>绑定明确字段，支持校验和 setValue，适合完全自定义的字段交互。</p>
              <router-link to="/form-table-advanced">查看高级示例 →</router-link>
            </article>
          </div>
        </el-tab-pane>

        <el-tab-pane label="渲染方式" name="modes">
          <div class="tab-intro">
            <h2>先按语义选择渲染入口</h2>
            <p>是否存在字段绑定与表单交互，是 <code>cellSlot</code> 和字段渲染链路的主要分界。</p>
          </div>
          <el-table :data="renderModes" border stripe>
            <el-table-column prop="mode" label="方式" width="120" />
            <el-table-column label="配置入口" min-width="260"><template #default="{ row }"><code>{{ row.config }}</code></template></el-table-column>
            <el-table-column prop="fieldKey" label="fieldKey" width="100" />
            <el-table-column prop="validation" label="表单校验" width="100" />
            <el-table-column label="上下文" min-width="210"><template #default="{ row }"><code>{{ row.scope }}</code></template></el-table-column>
            <el-table-column prop="usage" label="适用场景" min-width="240" />
          </el-table>

          <div class="model-panel">
            <h3>component.model</h3>
            <div><code>省略</code><span>使用组件原生 Vue 2 v-model</span></div>
            <div><code>{ prop, event, valueFromEvent }</code><span>适配非标准绑定协议</span></div>
            <div><code>false</code><span>关闭自动绑定，适合纯展示或手动同步</span></div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="事件与 Ref" name="events">
          <div class="tab-intro">
            <h2>公开事件</h2>
            <p><code>tableData</code> 是受控数据，<code>update:tableData</code> 应立即回写；后端持久化可以单独防抖。</p>
          </div>
          <el-table :data="eventRows" border stripe>
            <el-table-column label="事件" min-width="220"><template #default="{ row }"><code>{{ row.name }}</code></template></el-table-column>
            <el-table-column label="参数" min-width="340"><template #default="{ row }"><code>{{ row.payload }}</code></template></el-table-column>
            <el-table-column prop="description" label="说明" min-width="360" />
          </el-table>

          <div class="tab-intro ref-heading"><h2>公开 Ref</h2></div>
          <el-table :data="refRows" border stripe>
            <el-table-column label="方法" min-width="220"><template #default="{ row }"><code>{{ row.name }}</code></template></el-table-column>
            <el-table-column label="返回值" min-width="220"><template #default="{ row }"><code>{{ row.result }}</code></template></el-table-column>
            <el-table-column prop="description" label="说明" min-width="420" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import {
  apiGroups,
  contextRows,
  eventRows,
  featureCards,
  refRows,
  renderModes
} from '../docs/apiReference'

const activeTab = ref('paths')
const keyword = ref('')

const visibleApiGroups = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return apiGroups

  return apiGroups
    .map(group => ({
      ...group,
      entries: group.entries.filter(entry =>
        [entry.path, entry.type, entry.target, entry.description, entry.context]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(query))
      )
    }))
    .filter(group => group.entries.length > 0)
})
</script>

<style scoped>
.api-page { max-width: 1280px; margin: 0 auto; padding: 32px; color: #1f2937; }
.api-hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; margin: 18px 0 24px; padding: 28px; border: 1px solid #dbe5f1; border-radius: 16px; background: linear-gradient(135deg, #f8fbff, #eef5ff); }
.api-hero h1 { margin: 0; font-size: 32px; }
.api-hero p:not(.eyebrow) { max-width: 720px; margin: 12px 0 0; color: #526071; }
.eyebrow { margin: 0 0 8px; color: #2563eb; font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
.api-search { flex: 0 0 340px; }
.feature-section, .reference-section { margin-top: 20px; padding: 24px; border-radius: 14px; background: #fff; box-shadow: 0 8px 26px rgba(15, 23, 42, .06); }
.section-heading h2, .group-heading h2, .tab-intro h2 { margin: 0; }
.section-heading p, .group-heading p, .tab-intro p { margin: 8px 0 0; color: #64748b; }
.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; margin-top: 18px; }
.feature-card { padding: 16px; border: 1px solid #e2e8f0; border-radius: 10px; color: inherit; text-decoration: none; transition: border-color .2s, transform .2s; }
.feature-card:hover { border-color: #60a5fa; transform: translateY(-2px); }
.feature-card p { min-height: 42px; margin: 8px 0 12px; color: #64748b; font-size: 13px; }
.feature-card span { display: inline-block; margin: 3px 5px 0 0; padding: 2px 7px; border-radius: 99px; background: #eff6ff; color: #2563eb; font-size: 11px; }
.tree-panel { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; margin: 8px 0 22px; padding: 16px; border-left: 4px solid #3b82f6; background: #f8fafc; }
.tree-panel small { flex-basis: 100%; color: #64748b; }
.api-group + .api-group { margin-top: 30px; }
.group-heading { margin-bottom: 12px; }
.path-code { color: #1d4ed8; font-weight: 600; white-space: nowrap; }
.el-tag { margin-top: 6px; }
.boundary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 20px; }
.boundary-grid article, .model-panel { padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; }
.boundary-grid h3, .model-panel h3 { margin: 0 0 10px; }
.boundary-grid p { color: #64748b; }
.model-panel { margin-top: 20px; }
.model-panel div { display: grid; grid-template-columns: minmax(230px, 1fr) 2fr; gap: 16px; padding: 10px 0; border-top: 1px solid #e2e8f0; }
.ref-heading { margin-top: 28px; }
code { font-family: SFMono-Regular, Consolas, 'Liberation Mono', monospace; }
@media (max-width: 760px) {
  .api-page { padding: 18px; }
  .api-hero { align-items: stretch; flex-direction: column; }
  .api-search { flex-basis: auto; width: 100%; }
  .boundary-grid { grid-template-columns: 1fr; }
  .model-panel div { grid-template-columns: 1fr; gap: 5px; }
}
</style>
