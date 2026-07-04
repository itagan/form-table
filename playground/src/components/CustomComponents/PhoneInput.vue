<template>
  <div class="phone-input">
    <el-select 
      v-model="countryCode" 
      style="width: 80px; margin-right: 8px;"
      :size="size"
      :disabled="disabled"
      @change="handleCountryCodeChange"
    >
      <el-option label="+86" value="+86" />
      <el-option label="+1" value="+1" />
      <el-option label="+44" value="+44" />
      <el-option label="+81" value="+81" />
    </el-select>
    <el-input
      v-model="phoneNumber"
      :placeholder="placeholder"
      :clearable="clearable"
      :disabled="disabled"
      :readonly="readonly"
      :size="size"
      @input="handleInput"
      @change="handleChange"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'PhoneInput',
  props: {
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '请输入手机号'
    },
    clearable: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'default'
    }
  },
  data() {
    return {
      countryCode: '+86',
      phoneNumber: ''
    }
  },
  computed: {
    parsedPhone(): any {
      return (this as any).parsePhone(this.value)
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue: string) {
        const parsed = this.parsePhone(newValue)
        this.countryCode = parsed.countryCode
        this.phoneNumber = parsed.phoneNumber
      }
    }
  },
  methods: {
    parsePhone(phone: string) {
      if (!phone) return { countryCode: '+86', phoneNumber: '' }
      
      const match = phone.match(/^(\+\d+)(.+)$/)
      if (match) {
        return { countryCode: match[1], phoneNumber: match[2] }
      }
      
      return { countryCode: '+86', phoneNumber: phone }
    },
    handleInput(value: string) {
      const fullPhone = `${this.countryCode}${value}`
      this.$emit('input', fullPhone)
    },
    handleChange(value: string) {
      const fullPhone = `${this.countryCode}${value}`
      this.$emit('change', fullPhone)
    },
    handleCountryCodeChange(value: string) {
      const fullPhone = `${value}${this.phoneNumber}`
      this.$emit('input', fullPhone)
      this.$emit('change', fullPhone)
    }
  }
})
</script>

<style scoped>
.phone-input {
  display: flex;
  align-items: center;
}
</style>
