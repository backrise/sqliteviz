<template>
  <div>
    <svg
      class="import-table-icon"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      @click.stop="onClick"
      @mouseenter="showTooltip"
      @mouseleave="hideTooltip"
    >
      <path
        d="M2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V4Z"
        stroke="#A2B1C6"
        stroke-width="1.5"
      />
      <path
        d="M2 6H18"
        stroke="#A2B1C6"
        stroke-width="1.5"
      />
      <path
        d="M6 6V18"
        stroke="#A2B1C6"
        stroke-width="1.5"
      />
      <path
        d="M10 10L10 15M10 15L8 13M10 15L12 13"
        stroke="#A2B1C6"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span ref="tooltip" class="icon-tooltip" :style="tooltipStyle">
      Import additional tables without replacing the database
    </span>
  </div>
</template>

<script>
import tooltipMixin from '@/tooltipMixin'

export default {
  name: 'ImportTableIcon',
  mixins: [tooltipMixin],
  emits: ['click'],
  methods: {
    onClick() {
      this.hideTooltip()
      this.$emit('click')
    }
  }
}
</script>

<style scoped>
.import-table-icon {
  display: block;
  cursor: pointer;
}
.import-table-icon:hover path {
  stroke: var(--color-accent);
}
</style> 