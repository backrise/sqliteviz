<template>
  <span>
    <svg
      class="icon"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      @click.stop="onClick"
      @mouseenter="showTooltip"
      @mouseleave="hideTooltip"
    >
      <path
        d="M15 4.5H12V3C12 1.34 10.66 0 9 0C7.34 0 6 1.34 6 3V4.5H3C1.34 4.5 0 5.84 0 7.5V15C0 16.66 1.34 18 3 18H15C16.66 18 18 16.66 18 15V7.5C18 5.84 16.66 4.5 15 4.5ZM7.5 3C7.5 2.18 8.18 1.5 9 1.5C9.82 1.5 10.5 2.18 10.5 3V4.5H7.5V3ZM11.25 12.75L8.25 15.75C8.1 15.9 7.875 16 7.65 16C7.425 16 7.2 15.9 7.05 15.75L5.25 13.95C4.95 13.65 4.95 13.2 5.25 12.9C5.55 12.6 6 12.6 6.3 12.9L7.65 14.25L10.2 11.7C10.5 11.4 10.95 11.4 11.25 11.7C11.55 12 11.55 12.45 11.25 12.75Z"
        fill="#A2B1C6"
      />
      <path
        d="M13.5 9L15 10.5M13.5 12L15 10.5M15 10.5L16.5 9M15 10.5L16.5 12"
        stroke="#A2B1C6"
        stroke-width="1.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span ref="tooltip" class="icon-tooltip" :style="tooltipStyle">
      Generate SQL CREATE TABLE statements
    </span>
  </span>
</template>

<script>
import tooltipMixin from '@/tooltipMixin'

export default {
  name: 'GenerateDdlIcon',
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
.icon {
  display: block;
  margin: 0;
  cursor: pointer;
}

.icon:hover path {
  fill: var(--color-accent);
}
</style> 