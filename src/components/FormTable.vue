<!--表单嵌套表格组件-->
<template>
    <el-form ref="ruleFormRef" :model="formData" :rules="rules">
        <el-table
            :data="formData.tableData"
            border>
            <template v-for="(columnItem, columnIndex) in columns">
                <el-table-column
                    :label="columnItem.name"
                    :key="columnIndex"
                    v-bind="columnItem.props">
                    <template v-slot="scope">
                        <template v-for="(rowItem, rowIndex) in columnItem.children">
                            <el-row :gutter="10" :key="rowIndex" v-bind="rowItem.bind || rowItem.props">
                                <template v-for="(colItem, colIndex) in rowItem.children">
                                    <el-col :span="colItem.colSpan || colItem?.bind?.span" :key="colIndex" v-bind="colItem.bind">
                                        <el-form-item :prop="'tableData.' + scope.$index + `.${colItem.elFormItemProps.key}`" :rules="colItem.rules || colItem.elFormItemProps.rules">                                            
                                            <template v-if="!!colItem.isUseTooltip">
                                                <el-tooltip effect="dark" :disabled="!scope.row[colItem.elFormItemProps.key]" :content="scope.row[colItem.elFormItemProps.key] || ''" placement="top-start" v-bind="colItem.elTooltipProps">
                                                    <el-input v-if="colItem.type === 'input'" v-model="scope.row[colItem.elFormItemProps.key]" placeholder="请输入" v-bind="colItem.elInputProps"></el-input>
                                                    <span v-else-if="colItem.type === 'text'">{{ scope.row[colItem.elFormItemProps.key] }}</span>
                                                    <slot v-else-if="colItem.type === 'slotComponent' && colItem.slotName" :name="colItem.slotName" :row="scope.row" :index="scope.$index">
                                                    </slot>
                                                </el-tooltip>
                                            </template>
                                            <template v-else>
                                                <el-input v-if="colItem.type === 'input'" v-model="scope.row[colItem.elFormItemProps.key]" placeholder="请输入" v-bind="colItem.elInputProps"></el-input>
                                                <span v-else-if="colItem.type === 'text'">{{ scope.row[colItem.elFormItemProps.key] }}</span>
                                                <slot v-else-if="colItem.type === 'slotComponent' && colItem.slotName" :name="colItem.slotName" :row="scope.row" :index="scope.$index">
                                                </slot>
                                            </template>
                                        </el-form-item>
                                    </el-col>
                                </template>
                            </el-row>
                        </template>
                    </template>
                </el-table-column>
            </template>
        </el-table>
    </el-form>
</template>

<script lang="ts" setup>
    import { ref, defineProps, defineEmits, watch } from 'vue'

    // 定义props
    const props = withDefaults(defineProps<{
        tableData?: any[]
        columns?: any[]
        rules?: Record<string, any>
        formData?: Record<string, any>
    }>(), {
        tableData: () => [],
        columns: () => [],
        rules: () => ({}),
        formData: () => ({})
    })

    // 定义事件
    const emit = defineEmits(['update:formData', 'update:tableData'])

    // 表单验证
    const ruleFormRef = ref<any>(null)

    // 监听数据变化
    watch(() => props.tableData, (newVal) => {
        emit('update:tableData', newVal)
    }, { deep: true })

    watch(() => props.formData, (newVal) => {
        emit('update:formData', newVal)
    }, { deep: true })

    // 暴露方法给父组件
    defineExpose({
        validate: () => ruleFormRef.value?.validate(),
        resetFields: () => ruleFormRef.value?.resetFields(),
        clearValidate: () => ruleFormRef.value?.clearValidate()
    })
</script>

<style lang="less" scoped>
</style>
