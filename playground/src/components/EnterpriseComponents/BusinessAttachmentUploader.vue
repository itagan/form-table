<template>
  <div class="business-uploader">
    <el-button size="mini" :disabled="disabled" @click="addMockFile">
      模拟上传附件
    </el-button>
    <el-tag
      v-for="fileId in fileIds"
      :key="fileId"
      size="mini"
      closable
      :disable-transitions="true"
      @close="removeFile(fileId)"
    >
      {{ fileId }}
    </el-tag>
  </div>
</template>

<script lang="ts" setup>
interface UploadFile {
  id: string
  name: string
}

const props = withDefaults(defineProps<{
  fileIds?: string[]
  disabled?: boolean
}>(), {
  fileIds: () => [],
  disabled: false
})

const emit = defineEmits<{
  (event: 'files-change', files: UploadFile[], source: 'upload' | 'remove'): void
}>()

const toFiles = (ids: string[]) => ids.map(id => ({ id, name: `${id}.pdf` }))

const addMockFile = () => {
  const nextId = `file-${props.fileIds.length + 1}`
  emit('files-change', toFiles([...props.fileIds, nextId]), 'upload')
}

const removeFile = (fileId: string) => {
  emit('files-change', toFiles(props.fileIds.filter(id => id !== fileId)), 'remove')
}
</script>

<style scoped>
.business-uploader {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
</style>
