<template>
  <div class="tooltip-field">
    <slot />
    <span v-if="showTooltips" class="tooltip-icon">ⓘ</span>
    <div v-if="showTooltips" class="tooltip-popup">{{ tooltip }}</div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'

defineProps<{
  tooltip: string
}>()

const { showTooltips } = useAppStore()
</script>

<style scoped>
.tooltip-field {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.tooltip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: 4px;
  border-radius: 50%;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border);
  cursor: help;
  flex-shrink: 0;
  transition: all 0.15s;
  user-select: none;
}

.tooltip-field:hover .tooltip-icon {
  color: var(--accent);
  border-color: var(--accent);
  background: rgba(124, 58, 237, 0.08);
}

.tooltip-popup {
  display: none;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--text-primary);
  color: var(--bg-primary);
  font-size: 12px;
  line-height: 1.5;
  padding: 8px 12px;
  border-radius: 6px;
  white-space: normal;
  word-break: break-word;
  min-width: 140px;
  max-width: 420px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.tooltip-popup::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--text-primary);
}

.tooltip-field:hover .tooltip-popup {
  display: block;
}

/* Tooltip positioned above the icon, not the input */
.tooltip-field {
  /* Ensure tooltip stays within viewport */
  overflow: visible;
}
</style>