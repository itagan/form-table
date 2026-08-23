<template>
  <el-select
    :value="selection && selection.id"
    :clearable="clearable"
    :disabled="disabled"
    placeholder="请选择负责人"
    style="width: 100%;"
    @change="handleChange"
  >
    <el-option
      v-for="employee in employees"
      :key="employee.id"
      :label="`${employee.name} · ${employee.departmentName}`"
      :value="employee.id"
    />
  </el-select>
</template>

<script lang="ts" setup>
export interface EmployeeSelection {
  id: string
  name: string
  departmentId: string
  departmentName: string
}

const props = withDefaults(defineProps<{
  selection?: EmployeeSelection | null
  employees?: EmployeeSelection[]
  clearable?: boolean
  disabled?: boolean
}>(), {
  selection: null,
  employees: () => [],
  clearable: true,
  disabled: false
})

const emit = defineEmits<{
  (
    event: 'user-confirm',
    employee: EmployeeSelection | null,
    meta: { source: 'custom-field-type' }
  ): void
}>()

const handleChange = (employeeId: string) => {
  const employee = props.employees.find(item => item.id === employeeId) || null
  emit('user-confirm', employee, { source: 'custom-field-type' })
}
</script>
