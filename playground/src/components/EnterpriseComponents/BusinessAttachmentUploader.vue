<template>
  <div class="business-uploader">
    <input
      ref="fileInput"
      class="file-input"
      type="file"
      multiple
      :accept="accept"
      :disabled="disabled"
      @change="handleFiles"
    >
    <el-button
      size="mini"
      icon="el-icon-upload2"
      :disabled="disabled || fileIds.length >= limit"
      @click="openFileDialog"
    >
      选择附件
    </el-button>
    <span class="upload-tip">最多 {{ limit }} 个，单个不超过 {{ maxSizeMb }}MB</span>
    <div v-if="fileIds.length" class="file-list">
      <el-tag
        v-for="fileId in fileIds"
        :key="fileId"
        size="mini"
        :closable="!disabled"
        :disable-transitions="true"
        @close="removeFile(fileId)"
      >
        <i class="el-icon-document" /> {{ displayName(fileId) }}
      </el-tag>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

interface UploadFile {
  id: string
  name: string
  size: number
  status: 'success'
}

const props = withDefaults(defineProps<{
  fileIds?: string[]
  disabled?: boolean
  accept?: string
  limit?: number
  maxSizeMb?: number
}>(), {
  fileIds: () => [],
  disabled: false,
  accept: '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg',
  limit: 5,
  maxSizeMb: 10
})

const emit = defineEmits<{
  (event: 'files-change', files: UploadFile[], source: 'upload' | 'remove'): void
  (event: 'upload-error', error: Error): void
}>()

const fileInput = ref<HTMLInputElement>()
// Mock 上传服务的文件缓存，用于由业务 ID 反查展示名称。
const knownFiles = new Map<string, UploadFile>()

const fileFromId = (id: string): UploadFile => knownFiles.get(id) || {
  id,
  name: `${id}.pdf`,
  size: 0,
  status: 'success'
}

const currentFiles = () => props.fileIds.map(fileFromId)
const displayName = (id: string) => fileFromId(id).name

const openFileDialog = () => fileInput.value?.click()

const handleFiles = (event: Event) => {
  const input = event.target as HTMLInputElement
  const selectedFiles = Array.from(input.files || [])
  input.value = ''
  if (selectedFiles.length === 0) return

  if (props.fileIds.length + selectedFiles.length > props.limit) {
    emit('upload-error', new Error(`附件数量不能超过 ${props.limit} 个`))
    return
  }

  const oversized = selectedFiles.find(file => file.size > props.maxSizeMb * 1024 * 1024)
  if (oversized) {
    emit('upload-error', new Error(`${oversized.name} 超过 ${props.maxSizeMb}MB`))
    return
  }

  // 实际项目可在这里调用统一上传服务；示例生成稳定的业务文件结构。
  const uploaded = selectedFiles.map((file, index): UploadFile => {
    const uploadedFile = {
      id: `mock-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      status: 'success' as const
    }
    knownFiles.set(uploadedFile.id, uploadedFile)
    return uploadedFile
  })
  emit('files-change', [...currentFiles(), ...uploaded], 'upload')
}

const removeFile = (fileId: string) => {
  knownFiles.delete(fileId)
  emit('files-change', props.fileIds.filter(id => id !== fileId).map(fileFromId), 'remove')
}
</script>

<style scoped>
.business-uploader {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.file-input {
  display: none;
}

.upload-tip {
  color: #909399;
  font-size: 12px;
}

.file-list {
  display: flex;
  flex-basis: 100%;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
