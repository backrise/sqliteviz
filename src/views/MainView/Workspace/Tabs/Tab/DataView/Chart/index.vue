<template>
  <div ref="chartContainer" class="chart-container">
    <div v-show="!dataSources" class="warning chart-warning">
      There is no data to build a chart. Run your SQL query and make sure the
      result is not empty.
    </div>
    <div
      class="chart"
      :style="{ height: !dataSources ? 'calc(100% - 40px)' : '100%' }"
    >
      <PlotlyEditor
        ref="plotlyEditor"
        :data="state.data"
        :layout="state.layout"
        :frames="state.frames"
        :config="config"
        :dataSources="dataSources"
        :dataSourceOptions="dataSourceOptions"
        :plotly="plotly"
        :useResizeHandler="useResizeHandler"
        :debug="true"
        :advancedTraceTypeSelector="true"
        @update="update"
        @render="onRender"
      />
    </div>
  </div>
</template>

<script>
import { applyPureReactInVue } from 'veaury'
import plotly from 'plotly.js'
import 'react-chart-editor/lib/react-chart-editor.css'
import ReactPlotlyEditorWithPlotRef from '@/lib/ReactPlotlyEditorWithPlotRef.jsx'
import chartHelper from '@/lib/chartHelper'
import * as dereference from 'react-chart-editor/lib/lib/dereference'
import fIo from '@/lib/utils/fileIo'
import events from '@/lib/utils/events'

export default {
  name: 'Chart',
  components: {
    PlotlyEditor: applyPureReactInVue(ReactPlotlyEditorWithPlotRef)
  },
  props: {
    dataSources: Object,
    initOptions: Object,
    importToPngEnabled: Boolean,
    importToSvgEnabled: Boolean,
    forPivot: Boolean
  },
  emits: ['update:importToSvgEnabled', 'update', 'loadingImageCompleted'],
  data() {
    return {
      plotly,
      state: this.initOptions || {
        data: [],
        layout: { autosize: true },
        frames: []
      },
      config: {
        editable: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['toImage']
      },
      resizeObserver: null,
      useResizeHandler: this.$store.state.isWorkspaceVisible
    }
  },
  computed: {
    dataSourceOptions() {
      return chartHelper.getOptionsFromDataSources(this.dataSources)
    }
  },
  watch: {
    dataSources() {
      // we need to update state.data in order to update the graph
      // https://github.com/plotly/react-chart-editor/issues/948
      if (this.dataSources) {
        dereference.default(this.state.data, this.dataSources)
        this.updatePlotly()
      }
    }
  },
  created() {
    // https://github.com/plotly/plotly.js/issues/4555
    plotly.setPlotConfig({
      notifyOnLogging: 1
    })
    this.$watch(
      () =>
        this.state &&
        this.state.data &&
        this.state.data
          .map(trace => `${trace.type}${trace.mode ? '-' + trace.mode : ''}`)
          .join(','),
      value => {
        events.send('viz_plotly.render', null, {
          type: value,
          pivot: !!this.forPivot
        })
      },
      { deep: true }
    )
    this.$emit('update:importToSvgEnabled', true)
  },
  mounted() {
    this.resizeObserver = new ResizeObserver(this.handleResize)
    this.resizeObserver.observe(this.$refs.chartContainer)
    if (this.dataSources) {
      dereference.default(this.state.data, this.dataSources)
      this.updatePlotly()
    }
  },
  activated() {
    this.useResizeHandler = true
  },
  deactivated() {
    this.useResizeHandler = false
  },
  beforeUnmount() {
    this.resizeObserver.unobserve(this.$refs.chartContainer)
  },
  methods: {
    async handleResize() {
      this.updatePlotly()
    },
    onRender() {
      // TODO: check changes and enable Save button if needed
    },
    update(data, layout, frames) {
      this.state = { data, layout, frames }
      this.$emit('update')
    },
    updatePlotly() {
      const plotComponent = this.$refs.plotlyEditor.plotComponentRef.current
      plotComponent.updatePlotly(
        true, // shouldInvokeResizeHandler
        plotComponent.props.onUpdate, // figureCallbackFunction
        false // shouldAttachUpdateEvents
      )
    },
    getOptionsForSave() {
      return chartHelper.getOptionsForSave(this.state, this.dataSources)
    },
    async saveAsPng() {
      const url = await this.prepareCopy()
      this.$emit('loadingImageCompleted')
      fIo.downloadFromUrl(url, 'chart')
    },

    async saveAsSvg() {
      const url = await this.prepareCopy('svg')
      fIo.downloadFromUrl(url, 'chart')
    },

    saveAsHtml() {
      fIo.exportToFile(
        chartHelper.getHtml(this.state),
        'chart.html',
        'text/html'
      )
    },
    async prepareCopy(type = 'png') {
      return await chartHelper.getImageDataUrl(
        this.$refs.plotlyEditor.$el,
        type
      )
    }
  }
}
</script>

<style scoped>
.chart-container {
  height: 100%;
}

.chart-warning {
  height: 40px;
  line-height: 40px;
  border-bottom: 1px solid var(--color-border);
  box-sizing: border-box;
}

.chart {
  min-height: 242px;
}

:deep(.editor_controls .sidebar__item:before) {
  width: 0;
}
</style>
