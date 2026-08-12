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

    <section class="hint-choice-panel">
      <h2>先判断内容和展示责任</h2>
      <div class="hint-choice-grid">
        <div>
          <strong>固定说明</strong>
          <code>hint: '说明'</code>
          <span>默认 title；切换整表 mode 即可统一改为 Tooltip。</span>
        </div>
        <div>
          <strong>批量显示完整值</strong>
          <code>field: formatter</code>
          <span>未声明 hint 的字段自动继承统一 formatter。</span>
        </div>
        <div>
          <strong>特殊触发节点</strong>
          <code>behavior: 'custom'</code>
          <span>Schema 保留内容，Header/Field Slot 自行展示。</span>
        </div>
        <div>
          <strong>纯文本溢出</strong>
          <code>showOverflowTooltip</code>
          <span>使用 Element UI 的单元格能力，不创建字段 Hint。</span>
        </div>
      </div>
    </section>

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
          <li>有效 auto Hint 会在渲染属性中取代同层 <code>formItemProps.title</code>。</li>
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
        <p>表头与字段共享一个 Tooltip；普通字段继承全局 formatter，空 Hint 回退，<code>false</code> 明确关闭。</p>
        <FormTable
          v-model="tooltipRows"
          :columns="tooltipColumns"
          :form-props="formProps"
          :table-props="tableProps"
          :hint-options="tooltipHintOptions"
        />
        <ul class="scenario-notes">
          <li><code>placement: 'bottom-start'</code>、浅色主题、自定义 popper class。</li>
          <li>前两项使用统一格式化；第三项配置 <code>hint: false</code>，只保留原生 title。</li>
          <li>使用 Tab 聚焦表头或字段，按 Escape 关闭；移动到下一目标后可再次打开。</li>
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
        字符串 hint 默认仍由 FormTable 自动提示；配置 <code>{ content, behavior: 'custom' }</code> 后，提示内容
        保留在 Schema 中，FormTable 对任何字段类型都不再展示它；字段或表头 Slot 可以选择自行创建
        <code>el-tooltip</code>。<code>renderHeader</code> 与 <code>cellSlot</code> 则展示其他调用方边界。
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

        <template #manual-tooltip-header="{ label, header }">
          <span class="manual-tooltip-header">
            <span>{{ label }}</span>
            <el-tooltip
              :content="header.hint.content"
              placement="top"
              effect="light"
            >
              <i
                class="el-icon-question hint-icon"
                role="button"
                tabindex="0"
                aria-label="查看自定义表头提示"
              />
            </el-tooltip>
          </span>
        </template>

        <template #manual-tooltip-field="{ value, setValue, hint }">
          <div class="manual-tooltip-field">
            <el-input
              :value="value"
              size="small"
              placeholder="该字段的 hint.behavior 为 custom"
              @input="setValue"
            />
            <el-tooltip
              :content="hint.content"
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
          <span>hint 配置 behavior: 'custom'，Slot 读取 hint.content 后自行展示。</span>
        </div>
        <div>
          <strong>表头自定义 Tooltip</strong>
          <span>headerHint 同样支持 behavior: 'custom'，并通过 header.hint 暴露标准化结果。</span>
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

    <section class="scenario-card wide-card">
      <div class="scenario-heading">
        <div>
          <el-tag size="mini" type="danger">行为矩阵</el-tag>
          <h2><code>behavior: 'custom'</code> 对所有字段类型生效</h2>
        </div>
        <code>{ content, behavior: 'custom' }</code>
      </div>
      <p>
        下列内置字段、component 和字段 Slot 都配置了相同的关闭开关。FormTable 不展示这些 Hint；
        配置内容既可以只作为业务元数据，也可以由组件配置或 Slot 主动消费。最后一列演示完全不配置 hint。
      </p>

      <FormTable
        v-model="behaviorRows"
        :columns="behaviorColumns"
        :form-props="formProps"
        :table-props="{ ...tableProps, rowKey: 'id' }"
        :hint-options="{ mode: 'tooltip' }"
      >
        <template #owned-slot-field="{ value, setValue, hint }">
          <div class="manual-tooltip-field">
            <el-input
              :value="value"
              size="small"
              placeholder="Slot 读取标准化 hint"
              @input="setValue"
            />
            <el-tooltip :content="hint.content" placement="top">
              <el-button
                type="text"
                icon="el-icon-question"
                aria-label="查看 Slot 消费的配置 Hint"
              />
            </el-tooltip>
          </div>
        </template>

        <template #no-hint-field="{ value, setValue }">
          <div class="manual-tooltip-field">
            <el-input
              :value="value"
              size="small"
              placeholder="Schema 未配置 hint"
              @input="setValue"
            />
            <el-tooltip content="内容完全由 Slot 自己维护" placement="top">
              <el-button
                type="text"
                icon="el-icon-info"
                aria-label="查看 Slot 自有提示"
              />
            </el-tooltip>
          </div>
        </template>
      </FormTable>

      <div class="behavior-grid">
        <div>
          <strong>内置 input</strong>
          <code>hint: { content, behavior: 'custom' }</code>
          <span>不显示 FormTable Hint；保留 formItemProps.title。</span>
        </div>
        <div>
          <strong>component.renderer</strong>
          <code>hint: { content, behavior: 'custom' }</code>
          <span>不隐式注入 hint prop；component.props 可读取标准化 hint 后主动映射。</span>
        </div>
        <div>
          <strong>字段 Slot</strong>
          <code>hint: { content, behavior: 'custom' }</code>
          <span>scope.hint 提供标准化结果，问号 Tooltip 由 Slot 创建。</span>
        </div>
        <div>
          <strong>未配置 hint</strong>
          <code>hint: undefined</code>
          <span>FormTable 完全不参与，内容和 Tooltip 都由 Slot 自己维护。</span>
        </div>
      </div>

      <DemoCollapsiblePanel title="查看 Hint 行为矩阵配置">
        <pre>{{ behaviorConfigurationExample }}</pre>
      </DemoCollapsiblePanel>
    </section>

    <section class="scenario-card wide-card">
      <div class="scenario-heading">
        <div>
          <el-tag size="mini" type="info">实例隔离</el-tag>
          <h2>嵌套 FormTable</h2>
        </div>
        <code>nearest hint root</code>
      </div>
      <p>
        内外表格各自维护一个单例 Tooltip。悬停或聚焦内层字段时，事件只交给最近的 FormTable，
        不会同时打开外层 Tooltip。
      </p>
      <FormTable
        :table-data="nestedOuterRows"
        :columns="nestedOuterColumns"
        :form-props="formProps"
        :table-props="tableProps"
        :hint-options="{ mode: 'tooltip' }"
      >
        <template #nested-table="{ row }">
          <FormTable
            :table-data="row.nestedRows"
            :columns="nestedInnerColumns"
            :form-props="formProps"
            :table-props="tableProps"
            :hint-options="{ mode: 'tooltip' }"
          />
        </template>
      </FormTable>
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
  secondaryText: '第二个字段由空 Hint 回退全局',
  privateText: '不进入 Hint 系统'
}])

const tooltipHintOptions: FormTableHintOptions = {
  mode: 'tooltip',
  props: {
    placement: 'bottom-start',
    effect: 'light',
    openDelay: 80,
    popperClass: 'hint-scenarios-popper'
  },
  field: ({ value }) => value ? `当前完整内容：${String(value)}` : null
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
      colProps: { span: 8 },
      component: { props: { clearable: true, placeholder: '输入或清空内容' } }
    }, {
      fieldKey: 'secondaryText',
      type: 'input',
      colProps: { span: 8 },
      hint: () => undefined,
      component: { props: { placeholder: '空 Hint 回退 formatter' } }
    }, {
      fieldKey: 'privateText',
      type: 'input',
      colProps: { span: 8 },
      hint: false,
      formItemProps: { title: 'hint: false 保留的原生 title' },
      component: { props: { placeholder: 'false 退出全局 Hint' } }
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
  headerSlot: 'manual-tooltip-header',
  headerHint: {
    content: '此表头 Tooltip 由 headerSlot 自行创建',
    behavior: 'custom'
  },
  headerProps: { tabindex: -1 },
  props: { minWidth: 230 },
  children: [{
    children: [{
      fieldKey: 'manualValue',
      type: 'slot',
      hint: ({ row }) => ({
        content: `当前行 ${row.id}：此 Tooltip 完全由字段 Slot 管理`,
        behavior: 'custom'
      }),
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

const behaviorRows = ref<TableRow[]>([{
  id: 1,
  builtinOwned: '内置字段：仅保留原生 title',
  componentOwned: '组件主动读取配置内容',
  slotOwned: 'Slot 自己展示 Tooltip',
  noHintOwned: 'Slot 维护自己的固定文案'
}])

const behaviorColumns: ColumnConfig[] = [{
  key: 'builtin-owned-column',
  label: '内置字段 · custom behavior',
  props: { minWidth: 260 },
  children: [{ children: [{
    fieldKey: 'builtinOwned',
    type: 'input',
    hint: { content: '这段配置内容不会由 FormTable 展示', behavior: 'custom' },
    formItemProps: { title: 'custom behavior 会保留这个原生 title' },
    component: { props: { placeholder: '悬停表单项查看原生 title' } }
  }] }]
}, {
  key: 'component-owned-column',
  label: '自定义组件 · custom behavior',
  props: { minWidth: 330 },
  children: [{ children: [{
    fieldKey: 'componentOwned',
    type: 'component',
    hint: { content: '业务组件选择使用的配置内容', behavior: 'custom' },
    component: {
      renderer: HintCustomEditor,
      props: ({ hint }) => ({
        hintUsage: hint ? `业务读取：${hint.content}（${hint.behavior}）` : undefined
      })
    }
  }] }]
}, {
  key: 'slot-owned-column',
  label: '字段 Slot · custom behavior',
  props: { minWidth: 270 },
  children: [{ children: [{
    fieldKey: 'slotOwned',
    type: 'slot',
    hint: { content: 'Slot 从 scope.hint.content 读取此内容', behavior: 'custom' },
    component: { renderer: 'owned-slot-field' }
  }] }]
}, {
  key: 'no-hint-column',
  label: '字段 Slot · 不配置 hint',
  props: { minWidth: 270 },
  children: [{ children: [{
    fieldKey: 'noHintOwned',
    type: 'slot',
    component: { renderer: 'no-hint-field' }
  }] }]
}]

const nestedOuterRows: TableRow[] = [{
  id: 1,
  nestedRows: [{ note: '内层字段拥有自己的 Hint' }]
}]

const nestedOuterColumns: ColumnConfig[] = [{
  label: '外层表格（表头可聚焦）',
  headerHint: '这是外层 FormTable 的提示',
  cellSlot: 'nested-table',
  props: { minWidth: 520 }
}]

const nestedInnerColumns: ColumnConfig[] = [{
  label: '内层字段',
  headerHint: '这是内层 FormTable 的表头提示',
  children: [{ children: [{
    fieldKey: 'note',
    type: 'input',
    hint: '只有内层单例 Tooltip 会响应',
    component: { props: { readonly: true, placeholder: '悬停或键盘聚焦' } }
  }] }]
}]

const behaviorConfigurationExample = `const columns = [{
  label: '内置字段',
  children: [{ children: [{
    fieldKey: 'name',
    type: 'input',
    hint: { content: '业务元数据', behavior: 'custom' },
    formItemProps: { title: '仍保留的原生 title' }
  }] }]
}, {
  label: '自定义组件',
  children: [{ children: [{
    fieldKey: 'amount',
    type: 'component',
    hint: { content: '组件可选择使用', behavior: 'custom' },
    component: {
      renderer: BusinessEditor,
      props: ({ hint }) => ({
        hintUsage: hint.content
      })
    }
  }] }]
}, {
  label: '字段 Slot',
  children: [{ children: [{
    fieldKey: 'remark',
    type: 'slot',
    hint: { content: 'Slot 自行展示', behavior: 'custom' },
    component: { renderer: 'remark-editor' }
  }] }]
}]

<template #remark-editor="{ value, setValue, hint }">
  <el-input :value="value" @input="setValue" />
  <el-tooltip :content="hint.content">
    <i class="el-icon-question" />
  </el-tooltip>
</template>

<!-- 不配置 hint 时，Slot 也可以完全维护自己的提示内容。 -->`

const configurationExample = `<FormTable
  :hint-options="{
    mode: 'tooltip',
    props: {
      placement: 'bottom-start',
      effect: 'light',
      openDelay: 80,
      popperClass: 'hint-scenarios-popper'
    },
    field: ({ value }) => value ? \`当前完整内容：\${String(value)}\` : null
  }"
>
  <!-- behavior: 'custom' 时，Slot 从配置解析结果自行渲染 Tooltip -->
  <template #manual-tooltip-field="{ value, setValue, hint }">
    <el-input :value="value" @input="setValue" />
    <el-tooltip :content="hint.content">
      <i class="el-icon-question" />
    </el-tooltip>
  </template>
</FormTable>

const columns = [{
  headerHint: { content: '表头自定义提示', behavior: 'custom' },
  children: [{ children: [{
    hint: ({ row }) => ({
      content: \`最大可填写 \${row.availableAmount} 元\`,
      behavior: 'custom'
    })
  }] }]
}]

// 未声明或返回空值时继承全局；false 关闭并保留底层 title。
const inheritedItem = { fieldKey: 'remark', type: 'input' }
const fallbackItem = { fieldKey: 'summary', type: 'input', hint: () => undefined }
const disabledItem = { fieldKey: 'password', type: 'input', hint: false }

// 内容完全不属于 Schema 时，也可以省略 hint，在 Slot 内独立处理。`
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

.hint-choice-panel {
  margin-top: 20px;
  padding: 20px 22px;
  background: #f8fafc;
  border: 1px solid #dbe4ef;
  border-radius: 12px;
}

.hint-choice-panel h2 {
  margin: 0 0 14px;
  color: #111827;
  font-size: 18px;
}

.hint-choice-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.hint-choice-grid > div {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.hint-choice-grid code {
  color: #1d4ed8;
  font-size: 12px;
}

.hint-choice-grid span {
  color: #64748b;
  font-size: 13px;
  line-height: 1.55;
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

.manual-tooltip-header {
  display: inline-flex;
  align-items: center;
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

.behavior-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 18px 0;
}

.behavior-grid > div {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 14px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
}

.behavior-grid code {
  color: #c2410c;
  font-size: 12px;
}

.behavior-grid span {
  color: #64748b;
  font-size: 12px;
  line-height: 1.55;
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
  .hint-choice-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .scenario-grid,
  .boundary-grid,
  .behavior-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hint-demo-page {
    padding: 24px 16px 40px;
  }

  .hint-choice-grid {
    grid-template-columns: 1fr;
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
