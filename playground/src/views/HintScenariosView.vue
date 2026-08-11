<template>
  <main class="hint-demo-page">
    <header class="hint-demo-hero">
      <router-link to="/">← 返回</router-link>
      <p class="eyebrow">FormTable Hint Scenarios</p>
      <h1>Hint 展示策略与自定义渲染</h1>
      <p>
        对照 title、表级单实例 Tooltip、底层原生 title，以及表头 Slot、字段 Slot、自定义组件和
        Element UI 完全接管入口的实际行为。
      </p>
    </header>

    <section class="scenario-grid">
      <article class="scenario-card">
        <div class="scenario-heading">
          <div>
            <el-tag size="mini">默认策略</el-tag>
            <h2>原生 title</h2>
          </div>
          <code>{ mode: 'title' }</code>
        </div>
        <p>不配置 <code>hintOptions</code> 时使用浏览器原生 title，不创建 Tooltip 实例。</p>
        <FormTable
          v-model="titleRows"
          :columns="titleColumns"
          :form-props="formProps"
          :table-props="tableProps"
        />
        <ul class="scenario-notes">
          <li>显式 hint 会覆盖同层 <code>formItemProps.title</code>。</li>
          <li>未配置 hint 的节点仍可保留自己的原生 title。</li>
        </ul>
      </article>

      <article class="scenario-card">
        <div class="scenario-heading">
          <div>
            <el-tag size="mini" type="success">单实例</el-tag>
            <h2>自定义 Tooltip 属性</h2>
          </div>
          <code>hintOptions.props</code>
        </div>
        <p>表头与全部字段共享一个 Tooltip；修改输入值可以观察动态 hint 同步更新。</p>
        <FormTable
          v-model="tooltipRows"
          :columns="tooltipColumns"
          :form-props="formProps"
          :table-props="tableProps"
          :hint-options="tooltipHintOptions"
        />
        <ul class="scenario-notes">
          <li><code>placement: 'bottom-start'</code>、浅色主题、自定义 popper class。</li>
          <li>清空“动态内容”后 hint 返回空字符串，浮层不会显示。</li>
        </ul>
      </article>
    </section>

    <section class="scenario-card wide-card">
      <div class="scenario-heading">
        <div>
          <el-tag size="mini" type="warning">调用方自定义渲染</el-tag>
          <h2>Slot、组件与 Element UI 接管边界</h2>
        </div>
        <code>{ mode: 'tooltip' }</code>
      </div>
      <p>
        配置了 hint 的 Slot 和自定义组件仍由 FormTable 自动提示；需要字段级完全控制时，可以不配置 hint，
        直接在 Slot 内创建 <code>el-tooltip</code>。<code>renderHeader</code> 与 <code>cellSlot</code>
        则展示其他调用方边界。
      </p>

      <FormTable
        v-model="customRows"
        :columns="customColumns"
        :form-props="formProps"
        :table-props="{ ...tableProps, rowKey: 'id' }"
        :hint-options="{ mode: 'tooltip', props: { placement: 'top' } }"
      >
        <template #custom-header="{ label }">
          <span class="required-mark">*</span>
          <span>{{ label }}</span>
          <i class="el-icon-question hint-icon" aria-hidden="true" />
        </template>

        <template #custom-field="{ value, setValue }">
          <div class="custom-field-slot">
            <el-input
              :value="value"
              size="small"
              placeholder="字段 Slot 不需要手写 Tooltip"
              @input="setValue"
            />
            <el-button size="mini" @click="setValue('由 Slot 写入')">快速填充</el-button>
          </div>
        </template>

        <template #manual-tooltip-field="{ value, setValue, row }">
          <div class="manual-tooltip-field">
            <el-input
              :value="value"
              size="small"
              placeholder="该字段未配置 hint"
              @input="setValue"
            />
            <el-tooltip
              :content="`当前行 ${row.id}：此 Tooltip 完全由字段 Slot 管理`"
              placement="top"
              effect="light"
              popper-class="manual-field-tooltip"
            >
              <el-button
                class="manual-help-button"
                type="text"
                icon="el-icon-question"
                aria-label="查看字段级自定义提示"
              />
            </el-tooltip>
          </div>
        </template>

        <template #overflow-cell="{ row }">
          <span class="overflow-copy">{{ row.longText }}</span>
        </template>
      </FormTable>

      <div class="boundary-grid">
        <div>
          <strong>headerSlot</strong>
          <span>FormTable 包装 Slot，并自动应用 headerProps/headerHint。</span>
        </div>
        <div>
          <strong>字段 Slot / 自定义组件</strong>
          <span>外层 el-form-item 自动承接 hint，内部不创建 Tooltip。</span>
        </div>
        <div>
          <strong>字段级自定义 Tooltip</strong>
          <span>不配置 hint，由 Slot 内问号图标单独触发 el-tooltip。</span>
        </div>
        <div>
          <strong>renderHeader</strong>
          <span>Element UI 完全接管，示例中的原生 title 由 render 函数设置。</span>
        </div>
        <div>
          <strong>cellSlot</strong>
          <span>没有字段 Hint 语义，长文本使用 showOverflowTooltip。</span>
        </div>
      </div>
    </section>

    <DemoCollapsiblePanel class="scenario-card wide-card" title="关键配置">
      <pre>{{ configurationExample }}</pre>
    </DemoCollapsiblePanel>
  </main>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { CreateElement } from 'vue'
import FormTable from '@itagan/form-table'
import type {
  ColumnConfig,
  ComponentProps,
  FormTableHintOptions,
  TableRow
} from '@itagan/form-table'
import DemoCollapsiblePanel from '../components/DemoCollapsiblePanel.vue'
import HintCustomEditor from '../components/HintCustomEditor.vue'

const formProps: ComponentProps = { size: 'small' }
const tableProps: ComponentProps = { border: true, stripe: true }

const titleRows = ref<TableRow[]>([{
  semantic: '语义 Hint 优先',
  nativeTitle: '仅保留底层 title'
}])

const titleColumns: ColumnConfig[] = [{
  label: '默认 title 模式',
  headerHint: '这是浏览器原生表头提示',
  props: { minWidth: 480 },
  children: [{
    props: { gutter: 12 },
    children: [{
      fieldKey: 'semantic',
      type: 'input',
      colProps: { span: 12 },
      hint: 'hint 覆盖 formItemProps.title',
      formItemProps: { title: '不会展示的同层 title' },
      component: { props: { placeholder: '悬停整个表单项' } }
    }, {
      fieldKey: 'nativeTitle',
      type: 'input',
      colProps: { span: 12 },
      formItemProps: { title: '未配置 hint，因此保留原生 title' },
      component: {
        props: {
          title: '输入组件自己的 title',
          placeholder: '分别悬停表单项和输入框'
        }
      }
    }]
  }]
}]

const tooltipRows = ref<TableRow[]>([{
  dynamicText: '提示会随字段值变化',
  fixedText: '固定说明'
}])

const tooltipHintOptions: FormTableHintOptions = {
  mode: 'tooltip',
  props: {
    placement: 'bottom-start',
    effect: 'light',
    openDelay: 80,
    popperClass: 'hint-scenarios-popper'
  }
}

const tooltipColumns: ColumnConfig[] = [{
  label: '表级单实例 Tooltip',
  headerHint: ({ tableData }) => `当前共有 ${tableData.length} 行，表头与字段共享实例`,
  props: { minWidth: 480 },
  children: [{
    props: { gutter: 12 },
    children: [{
      fieldKey: 'dynamicText',
      type: 'input',
      colProps: { span: 12 },
      hint: ({ value }) => value ? `当前完整内容：${String(value)}` : '',
      component: { props: { clearable: true, placeholder: '输入或清空内容' } }
    }, {
      fieldKey: 'fixedText',
      type: 'input',
      colProps: { span: 12 },
      hint: '固定字段说明：无需为每个字段创建 el-tooltip',
      component: { props: { placeholder: '悬停查看固定提示' } }
    }]
  }]
}]

const customRows = ref<TableRow[]>([{
  id: 1,
  slotValue: '字段 Slot 内容',
  componentValue: '自定义组件内容',
  manualValue: '字段自行提示',
  ownedValue: '表头由 renderHeader 接管',
  longText: '这是由 cellSlot 渲染的很长展示文本，它使用 Element UI 的 showOverflowTooltip，而不是字段 Hint。'
}])

const customColumns: ColumnConfig[] = [{
  key: 'slot-column',
  label: '表头 Slot + 字段 Slot',
  headerSlot: 'custom-header',
  headerHint: ({ tableData }) => `自定义表头仍由 FormTable 提示，当前 ${tableData.length} 行`,
  headerProps: { 'aria-label': '自定义 Slot 表头说明' },
  props: { minWidth: 250 },
  children: [{
    children: [{
      fieldKey: 'slotValue',
      type: 'slot',
      hint: ({ value }) => `字段 Slot 完整内容：${String(value || '')}`,
      component: { renderer: 'custom-field' }
    }]
  }]
}, {
  key: 'component-column',
  label: '自定义组件',
  headerHint: '自定义组件列的表头说明',
  props: { minWidth: 280 },
  children: [{
    children: [{
      fieldKey: 'componentValue',
      type: 'component',
      hint: ({ value }) => `业务组件外层 Hint：${String(value || '')}`,
      component: { renderer: HintCustomEditor }
    }]
  }]
}, {
  key: 'manual-tooltip-column',
  label: '字段自主管理 Tooltip',
  props: { minWidth: 230 },
  children: [{
    children: [{
      fieldKey: 'manualValue',
      type: 'slot',
      // 此字段刻意不配置 hint，避免与 Slot 内的独立 el-tooltip 重复。
      component: { renderer: 'manual-tooltip-field' }
    }]
  }]
}, {
  key: 'render-header-column',
  label: 'renderHeader 接管',
  props: {
    minWidth: 190,
    renderHeader: (h: CreateElement) => h('span', {
      class: 'owned-render-header',
      attrs: { title: '这个 title 由 renderHeader 自己设置' }
    }, [
      h('i', { class: 'el-icon-edit-outline' }),
      ' 调用方表头'
    ])
  },
  children: [{
    children: [{
      fieldKey: 'ownedValue',
      type: 'input',
      hint: 'renderHeader 只接管表头，字段 Hint 仍正常工作'
    }]
  }]
}, {
  key: 'overflow-column',
  label: 'cellSlot 长文本',
  cellSlot: 'overflow-cell',
  props: { width: 170, showOverflowTooltip: true }
}]

const configurationExample = `<FormTable
  :hint-options="{
    mode: 'tooltip',
    props: {
      placement: 'bottom-start',
      effect: 'light',
      openDelay: 80,
      popperClass: 'hint-scenarios-popper'
    }
  }"
>
  <!-- 配置 hint 的 Slot 只渲染视觉内容，不创建 Tooltip -->
  <template #manual-tooltip-field="{ value, setValue, row }">
    <el-input :value="value" @input="setValue" />
    <el-tooltip :content="\`当前行 \${row.id}：字段自行管理\`">
      <i class="el-icon-question" />
    </el-tooltip>
  </template>
</FormTable>`
</script>

<style scoped>
.hint-demo-page {
  max-width: 1440px;
  margin: 0 auto;
  padding: 36px 32px 56px;
  color: #1f2937;
}

.hint-demo-hero {
  padding: 12px 0 8px;
}

.hint-demo-hero h1 {
  margin: 6px 0 10px;
  color: #111827;
  font-size: 30px;
}

.hint-demo-hero > p:last-child {
  max-width: 900px;
  margin: 0;
  color: #5b6472;
  line-height: 1.7;
}

.eyebrow {
  margin: 20px 0 0;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.scenario-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.scenario-card {
  margin-top: 20px;
  padding: 22px;
  background: #fff;
  border: 1px solid #e1e7ef;
  border-radius: 12px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
}

.wide-card {
  width: 100%;
}

.scenario-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
}

.scenario-heading h2 {
  margin: 8px 0 0;
  color: #111827;
  font-size: 20px;
}

.scenario-heading > code {
  padding: 6px 9px;
  color: #1d4ed8;
  background: #eff6ff;
  border-radius: 6px;
  white-space: nowrap;
}

.scenario-card > p {
  margin: 0 0 18px;
  color: #64748b;
  line-height: 1.65;
}

.scenario-notes {
  margin: 16px 0 0;
  padding-left: 20px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.8;
}

.required-mark {
  margin-right: 4px;
  color: #f56c6c;
}

.hint-icon {
  margin-left: 5px;
  color: #909399;
}

.custom-field-slot {
  display: flex;
  gap: 8px;
  width: 100%;
}

.custom-field-slot .el-input {
  flex: 1;
}

.manual-tooltip-field {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.manual-tooltip-field .el-input {
  flex: 1;
}

.manual-help-button {
  flex: none;
  padding: 6px;
  font-size: 17px;
}

.overflow-copy {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.boundary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.boundary-grid > div {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.boundary-grid strong,
.boundary-grid span {
  display: block;
}

.boundary-grid strong {
  margin-bottom: 5px;
  color: #334155;
}

.boundary-grid span {
  color: #64748b;
  font-size: 12px;
  line-height: 1.55;
}

pre {
  margin: 0;
  padding: 16px;
  overflow: auto;
  background: #f6f8fa;
  border-radius: 8px;
}

@media (max-width: 980px) {
  .scenario-grid,
  .boundary-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hint-demo-page {
    padding: 24px 16px 40px;
  }

  .scenario-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

<style>
.hint-scenarios-popper {
  max-width: 360px;
  border-color: #93c5fd !important;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.16);
}

.manual-field-tooltip {
  max-width: 320px;
}
</style>
