<template>
  <el-row 
    :gutter="gutter" 
    :key="rowIndex" 
    v-bind="rowBind"
  >
    <el-col 
      v-for="(colItem, colIndex) in rowChildren"
      :key="colIndex"
      :span="colItem.colSpan || 24"
      v-bind="colItem.bind"
    >
      <!-- 直接在这里处理插槽组件 -->
      <el-form-item 
        v-if="colItem.type === 'slotComponent' && colItem.slotName"
        :prop="`tableData.${rowIndex}.${colItem.key}`"
        :rules="colItem.rules"
        :label="colItem.label"
        :label-width="colItem.labelWidth"
      >

        <slot 
          :name="colItem.slotName" 
          :row="row" 
          :index="rowIndex"
        />

      </el-form-item>
      
      <!-- 非插槽组件使用 FormTableItem -->
      <FormTableItem
        v-else
        :prop-path="`tableData.${rowIndex}.${colItem.key}`"
        :rules="colItem.rules"
        :label="colItem.label"
        :label-width="colItem.labelWidth"
        :is-use-tooltip="colItem.isUseTooltip"
        :tooltip-props="colItem.tooltipProps"
        :row="row"
        :index="rowIndex"
        :config="colItem"
      >
        <!-- 动态传递所有具名插槽 -->
        <template v-for="(_, slotName) in $slots" v-slot:[slotName]="slotProps">
          <slot :name="slotName" v-bind="slotProps" />
        </template>
      </FormTableItem>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import FormTableItem from './FormTableItem.vue'
import type { RowConfig, TableRow } from './types'

interface Props {
  row: TableRow
  rowIndex: number
  rowConfig: RowConfig
}

const props = defineProps<Props>()

// 计算属性
const gutter = computed(() => {
  return props.rowConfig.gutter || props.rowConfig.bind?.gutter || 10
})

const rowBind = computed(() => {
  return props.rowConfig.bind || props.rowConfig.props || {}
})

const rowChildren = computed(() => {
  return props.rowConfig.children || []
})
</script>
