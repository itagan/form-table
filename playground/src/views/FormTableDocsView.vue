<template>
  <main class="docs-page">
    <router-link to="/">← 返回</router-link>
    <h1>FormTable 精简 API</h1>

    <section>
      <h2>核心边界</h2>
      <ul>
        <li><code>children</code> 描述 Column → Row → Item 布局。</li>
        <li><code>type</code> 是唯一渲染策略：内置别名、component 或 slot。</li>
        <li><code>component.renderer</code> 指向动态组件或具名 slot。</li>
        <li><code>component.props/listeners/options</code> 是三种模式共用的配置。</li>
        <li>行增删、复制和字段联动由业务层维护。</li>
      </ul>
    </section>

    <section>
      <h2>各层属性</h2>
      <p>配置按实际渲染结构分层。节点自身的 <code>props</code> 只透传给该层对应的 Element UI 组件。</p>

      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>层级</th>
              <th>属性</th>
              <th>目标/作用</th>
              <th>说明</th>
              <th>动态函数上下文</th>
            </tr>
          </thead>
          <tbody class="layer-group">
            <tr>
              <th rowspan="4" scope="rowgroup" class="layer-cell">FormTable</th>
              <td><code>tableData</code></td>
              <td>el-table data</td>
              <td>唯一编辑数据源，通过 <code>update:tableData</code> 返回新数组。</td>
              <td rowspan="4" class="context-cell">—</td>
            </tr>
            <tr>
              <td><code>columns</code></td>
              <td>Column → Row → Item</td>
              <td>完整布局与字段渲染配置。</td>
            </tr>
            <tr>
              <td><code>formProps</code> / <code>tableProps</code></td>
              <td>el-form / el-table</td>
              <td>直接透传 Element UI 原生属性。</td>
            </tr>
            <tr>
              <td><code>loading</code></td>
              <td>el-table v-loading</td>
              <td>控制表格加载状态。</td>
            </tr>
          </tbody>

          <tbody class="layer-group">
            <tr>
              <th rowspan="6" scope="rowgroup" class="layer-cell">Column</th>
              <td><code>key</code></td>
              <td>渲染标识</td>
              <td>可选；动态增删或重排列时建议提供。</td>
              <td rowspan="6" class="context-cell"><code>tableData</code></td>
            </tr>
            <tr>
              <td><code>label</code></td>
              <td>el-table-column label</td>
              <td>列头文本；复杂表头使用 <code>headerSlot</code>。</td>
            </tr>
            <tr>
              <td><code>props</code></td>
              <td>el-table-column</td>
              <td>例如 <code>width</code>、<code>minWidth</code>、<code>align</code>、<code>type</code>。</td>
            </tr>
            <tr>
              <td><code>headerSlot</code></td>
              <td>表头 scoped slot</td>
              <td>接收 <code>label/column/columnIndex/tableData</code>；columnIndex 是显隐过滤后的可见列下标。</td>
            </tr>
            <tr>
              <td><code>visible</code></td>
              <td>列显隐</td>
              <td>静态布尔值或动态函数。</td>
            </tr>
            <tr>
              <td><code>children</code></td>
              <td>RowConfig[]</td>
              <td>列单元格内的行布局。</td>
            </tr>
          </tbody>

          <tbody class="layer-group">
            <tr>
              <th rowspan="4" scope="rowgroup" class="layer-cell">Row</th>
              <td><code>key</code></td>
              <td>渲染标识</td>
              <td>可选；同一列内有动态行布局时建议提供。</td>
              <td rowspan="4" class="context-cell"><code>tableData</code><br><code>row</code><br><code>index</code></td>
            </tr>
            <tr>
              <td><code>props</code></td>
              <td>el-row</td>
              <td>例如 <code>gutter</code>、<code>justify</code>、<code>align</code>。</td>
            </tr>
            <tr>
              <td><code>visible</code></td>
              <td>行布局显隐</td>
              <td>静态布尔值或动态函数。</td>
            </tr>
            <tr>
              <td><code>children</code></td>
              <td>FormItemConfig[]</td>
              <td>当前栅格行中的字段列表。</td>
            </tr>
          </tbody>

          <tbody class="layer-group">
            <tr>
              <th rowspan="7" scope="rowgroup" class="layer-cell">Item</th>
              <td><code>key</code></td>
              <td>渲染标识</td>
              <td>可选；动态增删、排序或重复 fieldKey 时建议提供。</td>
              <td rowspan="7" class="context-cell"><code>tableData</code><br><code>row</code><br><code>index</code><br><code>fieldKey</code><br><code>value</code></td>
            </tr>
            <tr>
              <td><code>fieldKey</code></td>
              <td>行数据字段路径</td>
              <td>支持 <code>name</code>、<code>profile.city</code>、<code>items[0].name</code>。</td>
            </tr>
            <tr>
              <td><code>visible</code></td>
              <td>字段显隐</td>
              <td>静态布尔值或动态函数。</td>
            </tr>
            <tr>
              <td><code>colProps</code></td>
              <td>el-col</td>
              <td>控制字段栅格，例如 <code>span</code>、<code>offset</code>。</td>
            </tr>
            <tr>
              <td><code>formItemProps</code></td>
              <td>el-form-item</td>
              <td>配置 <code>label</code>、<code>rules</code> 等；校验路径由组件根据 fieldKey 自动生成。</td>
            </tr>
            <tr>
              <td><code>type</code></td>
              <td>字段渲染策略</td>
              <td>内置别名，或明确使用 <code>component</code>、<code>slot</code>。</td>
            </tr>
            <tr>
              <td><code>component</code></td>
              <td>统一渲染配置</td>
              <td>配置 renderer、属性、事件和选项；slot 模式通过同名 <code>component</code> 上下文返回。</td>
            </tr>
          </tbody>

          <tbody class="layer-group">
            <tr>
              <th rowspan="5" scope="rowgroup" class="layer-cell">Component</th>
              <td><code>renderer</code></td>
              <td>渲染目标</td>
              <td>component 模式为组件对象/名称；slot 模式为具名 slot 名称。</td>
              <td rowspan="4" class="context-cell"><code>tableData</code><br><code>row</code><br><code>index</code><br><code>fieldKey</code><br><code>value</code></td>
            </tr>
            <tr>
              <td><code>props</code></td>
              <td>实际字段组件</td>
              <td>静态对象或动态函数，结果直接透传。</td>
            </tr>
            <tr>
              <td><code>options</code></td>
              <td>选项型组件</td>
              <td>用于 select、radio、checkbox 等选项渲染。</td>
            </tr>
            <tr>
              <td><code>optionProps</code></td>
              <td>选项字段映射</td>
              <td>自定义 label、value、disabled、key 字段名。</td>
            </tr>
            <tr>
              <td><code>listeners</code></td>
              <td>实际组件事件</td>
              <td>首参为字段上下文，后续参数保持组件原始事件参数。</td>
              <td class="context-cell"><code>Item 上下文</code><br>+ <code>setValue</code><br><code>updateRow</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>完整结构</h3>
      <pre>{{ propsExample }}</pre>
    </section>

    <section>
      <h2>上下文回传示例</h2>
      <p><code>row</code> 是当前数据行，<code>index</code> 是数据下标，<code>fieldKey</code> 是当前字段路径；不会返回完整的 Column、Row 或 Item 配置对象。</p>
      <pre>{{ contextExample }}</pre>
    </section>

    <section>
      <h2>远程 JSON</h2>
      <p>远程只返回布局、type、静态 props/options；组件对象、事件函数和 slot 实现在页面本地按 fieldKey 增强。</p>
      <router-link to="/remote-schema">查看可运行示例 →</router-link>
    </section>

    <section>
      <h2>公开事件和 Ref</h2>
      <p>组件事件只有 <code>update:tableData</code> 和 <code>field-change</code>；Table 原生事件直接透传。</p>
      <pre>{{ refExample }}</pre>
    </section>
  </main>
</template>

<script lang="ts" setup>
const propsExample = `{
  label: '姓名',                // el-table-column label
  props: { minWidth: 180 },    // el-table-column
  children: [{
    props: { gutter: 8 },      // el-row
    children: [{
      key: 'primary-name',       // 稳定渲染身份
      fieldKey: 'name',
      type: 'input',
      colProps: { span: 12 },  // el-col
      formItemProps: {         // el-form-item
        rules: [{ required: true }]
      },
      component: {
        props: { clearable: true },
        listeners: {},
        options: []
      }
    }]
  }]
}`

const contextExample = `{
  label: '地区',
  visible: ({ tableData }) => tableData.length > 0,
  props: ({ tableData }) => ({ minWidth: tableData.length > 5 ? 360 : 280 }),
  children: [{
    visible: ({ row }) => row.hidden !== true,
    props: ({ row, index }) => ({
      gutter: row.compact ? 4 : 12,
      class: 'data-row-' + index
    }),
    children: [{
      fieldKey: 'city',
      type: 'select',
      visible: ({ row, fieldKey, value }) => fieldKey === 'city' && Boolean(row.province) && value !== 'disabled',
      colProps: ({ index }) => ({ span: index === 0 ? 12 : 8 }),
      component: {
        props: ({ row }) => ({ disabled: row.locked }),
        options: ({ row }) => cityOptions[row.province] || [],
        listeners: {
          change({ row, index, fieldKey, value, setValue, updateRow }, nextValue) {
            console.log('修改前', row, index, fieldKey, value)
            setValue(nextValue)
            updateRow({ cityTouched: true })
          }
        }
      }
    }]
  }]
}`

const refExample = `await formTableRef.value?.validate()
formTableRef.value?.clearValidate()
formTableRef.value?.getFormRef()
formTableRef.value?.getTableRef()`
</script>

<style scoped>
.docs-page { max-width: 1120px; margin: 0 auto; padding: 32px; }
section { margin-top: 20px; padding: 24px; background: #fff; border-radius: 12px; }
pre { padding: 16px; overflow: auto; background: #f6f8fa; border-radius: 8px; }
li { margin: 8px 0; }
.table-scroll { overflow-x: auto; }
table { min-width: 980px; width: 100%; border-collapse: collapse; font-size: 14px; }
th, td { padding: 12px; border: 1px solid #e5e7eb; text-align: left; vertical-align: top; }
th { background: #f6f8fa; white-space: nowrap; }
.layer-group + .layer-group { border-top: 3px solid #cbd5e1; }
.layer-cell { color: #1d4ed8; background: #eff6ff; text-align: center; vertical-align: middle; }
.context-cell { color: #475569; background: #f8fafc; line-height: 1.8; vertical-align: middle; }
h3 { margin-top: 24px; }
</style>
