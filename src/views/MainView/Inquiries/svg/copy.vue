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
        d="M14.25 15.75H6V5.25H14.25V15.75ZM14.25 3.75H6C5.60218 3.75 5.22064 3.90804 4.93934
        4.18934C4.65804 4.47064 4.5 4.85218 4.5 5.25V15.75C4.5 16.1478 4.65804 16.5294 4.93934
        16.8107C5.22064 17.092 5.60218 17.25 6 17.25H14.25C14.6478 17.25 15.0294 17.092 15.3107
        16.8107C15.592 16.5294 15.75 16.1478 15.75 15.75V5.25C15.75 4.85218 15.592 4.47064
        15.3107 4.18934C15.0294 3.90804 14.6478 3.75 14.25 3.75ZM12 0.75H3C2.60218 0.75 2.22064
        0.908035 1.93934 1.18934C1.65804 1.47064 1.5 1.85218 1.5 2.25V12.75H3V2.25H12V0.75Z"
        fill="#A2B1C6"
      />
    </svg>
    <span ref="tooltip" class="icon-tooltip" :style="tooltipStyle">
      Duplicate inquiry
    </span>
  </span>
</template>

<script>
import tooltipMixin from '@/tooltipMixin'

export default {
  name: 'CopyIcon',
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
  margin: 0 12px;
}
.icon:hover path {
  fill: var(--color-accent);
}
</style>
