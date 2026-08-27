<template>
  <div>
    <section v-if="selectedDemands.length === 0" class="demand-card empty-card">
      请至少勾选一个需求项。
    </section>

    <section
      v-for="demand in selectedDemands"
      :key="demand.key"
      class="demand-card"
      :data-demand-key="demand.key"
    >
      <div class="demand-heading">
        <div>
          <h2>{{ demand.label }}</h2>
          <span>{{ demand.description }}</span>
        </div>
        <div class="demand-summary">
          <el-tag size="small" type="info">{{ demandRows[demand.key].length }} 行</el-tag>
          <el-button size="small" type="primary" @click="emit('append-row', demand.key)">
            末尾新增
          </el-button>
        </div>
      </div>

      <FormTable
        :table-data="demandRows[demand.key]"
        :columns="columns"
        row-key="id"
        :form-props="{ size: 'small' }"
        :table-props="{ border: true, emptyText: '暂无明细，请点击末尾新增' }"
        @update:tableData="emit('replace-rows', demand.key, $event)"
      >
        <template #demand-actions="{ row }">
          <div class="row-actions">
            <el-button type="text" @click="emit('insert-after', demand.key, row)">后插一行</el-button>
            <el-button type="text" class="danger" @click="emit('remove-row', demand.key, row)">删除</el-button>
          </div>
        </template>
      </FormTable>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, TableRow } from '@itagan/form-table'

type DemandKey = 'hotel' | 'meal' | 'car' | 'train' | 'flight'

interface DemandOption {
  key: DemandKey
  label: string
  description: string
}

const props = defineProps<{
  selectedKeys: DemandKey[]
  demandOptions: DemandOption[]
  demandRows: Record<DemandKey, TableRow[]>
  columns: ColumnConfig[]
}>()

const emit = defineEmits<{
  (event: 'replace-rows', key: DemandKey, rows: TableRow[]): void
  (event: 'append-row', key: DemandKey): void
  (event: 'insert-after', key: DemandKey, row: TableRow): void
  (event: 'remove-row', key: DemandKey, row: TableRow): void
}>()

/** 表单列表不维护选择状态，只根据父组件通过 props 下发的 selectedKeys 渲染。 */
const selectedDemands = computed(() => props.demandOptions.filter(
  demand => props.selectedKeys.includes(demand.key)
))
</script>

<style scoped>
.demand-card {
  margin-top: 20px;
  padding: 22px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.demand-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.demand-heading h2 { margin: 0; }
.demand-heading span { color: #64748b; font-size: 13px; }
.demand-summary, .row-actions { display: flex; align-items: center; gap: 10px; }
.row-actions { justify-content: center; white-space: nowrap; }
.danger { color: #f56c6c; }
.empty-card { color: #64748b; text-align: center; }

@media (max-width: 760px) {
  .demand-heading { align-items: flex-start; flex-direction: column; }
}
</style>
