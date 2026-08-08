<template>
  <main class="docs-page">
    <router-link to="/">← 返回</router-link>
    <h1>FormTable 精简 API</h1>

    <section>
      <h2>核心边界</h2>
      <ul>
        <li><code>children</code> 描述 Column → Row → Item 布局。</li>
        <li><code>type</code> 提供 Element UI 常用组件快捷映射。</li>
        <li><code>component.is</code> 直接接收自定义组件。</li>
        <li><code>slot</code> 提供完全自定义渲染。</li>
        <li>行增删、复制和字段联动由业务层维护。</li>
      </ul>
    </section>

    <section>
      <h2>各层属性</h2>
      <pre>{{ propsExample }}</pre>
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
  name: '姓名',                 // el-table-column label
  props: { minWidth: 180 },    // el-table-column
  children: [{
    props: { gutter: 8 },      // el-row
    children: [{
      key: 'name',
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

const refExample = `await formTableRef.value?.validate()
formTableRef.value?.clearValidate()
formTableRef.value?.getFormRef()
formTableRef.value?.getTableRef()`
</script>

<style scoped>
.docs-page { max-width: 900px; margin: 0 auto; padding: 32px; }
section { margin-top: 20px; padding: 24px; background: #fff; border-radius: 12px; }
pre { padding: 16px; overflow: auto; background: #f6f8fa; border-radius: 8px; }
li { margin: 8px 0; }
</style>
