<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import PlaygroundNavigation from './components/PlaygroundNavigation.vue'
import { findExampleByPath } from './exampleCatalog'
import router from './router'

// 可覆盖文档地址；同站部署复用统一基址，本地开发默认使用固定的 VitePress 端口。
const docsSiteUrl = import.meta.env.VITE_DOCS_SITE_URL
  || import.meta.env.VITE_SITE_BASE
  || 'http://localhost:5174/'

const compactMedia = window.matchMedia('(max-width: 960px)')
const isCompact = ref(compactMedia.matches)
const navigationOpen = ref(!compactMedia.matches)
const activePath = ref(router.currentRoute.path)
const activeExample = computed(() => findExampleByPath(activePath.value))
const pageTitle = computed(() => activeExample.value?.title || '示例概览')

const syncViewport = (event: MediaQueryListEvent) => {
  isCompact.value = event.matches
  navigationOpen.value = !event.matches
}

const closeNavigationOnEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && navigationOpen.value) navigationOpen.value = false
}

const removeAfterEach = router.afterEach(to => {
  activePath.value = to.path
  if (isCompact.value) navigationOpen.value = false
})

watch([isCompact, navigationOpen], ([compact, open]) => {
  document.body.style.overflow = compact && open ? 'hidden' : ''
})

onMounted(() => {
  compactMedia.addEventListener('change', syncViewport)
  window.addEventListener('keydown', closeNavigationOnEscape)
})
onBeforeUnmount(() => {
  compactMedia.removeEventListener('change', syncViewport)
  window.removeEventListener('keydown', closeNavigationOnEscape)
  document.body.style.overflow = ''
  removeAfterEach()
})
</script>

<template>
  <div id="app" class="playground-shell" :class="{ 'navigation-open': navigationOpen }">
    <aside
      id="playground-navigation"
      class="playground-sidebar"
      :aria-hidden="navigationOpen ? 'false' : 'true'"
    >
      <PlaygroundNavigation
        :active-path="activePath"
        :docs-site-url="docsSiteUrl"
        @navigate="isCompact && (navigationOpen = false)"
        @close="navigationOpen = false"
      />
    </aside>

    <transition name="navigation-backdrop">
      <button
        v-if="isCompact && navigationOpen"
        class="navigation-backdrop"
        type="button"
        aria-label="关闭示例菜单"
        @click="navigationOpen = false"
      />
    </transition>

    <section class="playground-workspace">
      <header class="workspace-header">
        <div class="workspace-title">
          <button
            class="navigation-toggle"
            type="button"
            :aria-label="navigationOpen ? '收起示例菜单' : '展开示例菜单'"
            :aria-expanded="navigationOpen ? 'true' : 'false'"
            aria-controls="playground-navigation"
            @click="navigationOpen = !navigationOpen"
          >
            <i :class="navigationOpen ? 'el-icon-s-fold' : 'el-icon-s-unfold'" aria-hidden="true" />
          </button>
          <div>
            <span>FormTable Playground</span>
            <strong>{{ pageTitle }}</strong>
          </div>
        </div>
        <nav class="workspace-links" aria-label="站点切换">
          <router-link v-if="activePath !== '/' && (!navigationOpen || isCompact)" to="/">示例概览</router-link>
          <a v-if="!navigationOpen || isCompact" :href="docsSiteUrl">文档总站</a>
        </nav>
      </header>

      <div class="playground-content">
        <router-view />
      </div>
    </section>
  </div>
</template>

<style scoped>
.playground-shell {
  display: grid;
  grid-template-columns: 0 minmax(0, 1fr);
  min-height: 100vh;
  transition: grid-template-columns 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.playground-shell.navigation-open {
  grid-template-columns: 280px minmax(0, 1fr);
}

.playground-sidebar {
  position: sticky;
  top: 0;
  z-index: 1200;
  width: 280px;
  height: 100vh;
  overflow: hidden;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-100%);
  transition:
    transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.2s ease,
    visibility 0s linear 0.28s;
}

.navigation-open .playground-sidebar {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0);
  transition-delay: 0s;
}

.playground-workspace {
  min-width: 0;
}

.workspace-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: 8px 22px;
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid #e2e8f0;
  backdrop-filter: blur(12px);
}

.workspace-title {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
}

.workspace-title span,
.workspace-title strong {
  display: block;
}

.workspace-title span {
  color: #64748b;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-transform: uppercase;
}

.workspace-title strong {
  max-width: 52vw;
  margin-top: 2px;
  overflow: hidden;
  color: #0f172a;
  font-size: 14px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navigation-toggle {
  display: grid;
  width: 36px;
  height: 36px;
  flex: none;
  place-items: center;
  color: #475569;
  background: #ffffff;
  border: 1px solid #dbe3ee;
  border-radius: 8px;
  cursor: pointer;
  transition: color 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
}

.navigation-toggle:hover {
  color: #2563eb;
  border-color: #93c5fd;
}

.workspace-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.workspace-links a {
  padding: 7px 10px;
  color: #475569;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.workspace-links a:hover {
  color: #2563eb;
  background: #eff6ff;
}

.playground-content {
  min-width: 0;
}

.navigation-backdrop {
  display: none;
}

.navigation-backdrop-enter-active,
.navigation-backdrop-leave-active {
  transition: opacity 0.24s ease;
}

.navigation-backdrop-enter,
.navigation-backdrop-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .playground-shell,
  .playground-shell.navigation-open {
    display: block;
  }

  .playground-sidebar {
    position: fixed;
    left: 0;
    width: min(86vw, 320px);
    box-shadow: 18px 0 42px rgba(15, 23, 42, 0.24);
  }

  .navigation-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1100;
    display: block;
    padding: 0;
    background: rgba(15, 23, 42, 0.48);
    border: 0;
  }

  .workspace-header {
    padding: 8px 14px;
  }

  .workspace-title span {
    display: none;
  }

  .workspace-title strong {
    margin: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .playground-shell,
  .playground-sidebar,
  .navigation-backdrop-enter-active,
  .navigation-backdrop-leave-active {
    transition-duration: 0.01ms;
  }
}

@media (max-width: 560px) {
  .workspace-links {
    gap: 0;
  }

  .workspace-links a {
    padding-inline: 7px;
  }
}
</style>
