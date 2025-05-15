<template>
  <div class="table-uploader-container" :style="{ width }">
    <import-table-icon v-if="type === 'small'" @click="browse" />
    <div v-if="type === 'illustrated'" class="drop-area-container">
      <div
        class="drop-area"
        @dragover.prevent="state = 'dragover'"
        @dragleave.prevent="state = ''"
        @drop.prevent="drop"
        @click="browse"
      >
        <div class="text">
          Drop the CSV, JSON, NDJSON or XLSX file here to add a new table to your current database.
        </div>
      </div>
    </div>

    <!--Parse csv or json dialog  -->
    <csv-json-import
      ref="addCsvJson"
      :file="file"
      :db="currentDb"
      dialogName="importAdditionalTable"
      @cancel="cancelImport"
      @finish="finish"
    />
  </div>
</template>

<script>
import fIo from '@/lib/utils/fileIo'
import ImportTableIcon from '@/components/svg/importTable'
import CsvJsonImport from '@/components/CsvJsonImport'
import events from '@/lib/utils/events'

export default {
  name: 'TableUploader',
  components: {
    ImportTableIcon,
    CsvJsonImport
  },
  props: {
    type: {
      type: String,
      required: false,
      default: 'small',
      validator: value => {
        return ['illustrated', 'small'].includes(value)
      }
    },
    width: {
      type: String,
      required: false,
      default: 'unset'
    }
  },
  emits: [],
  data() {
    return {
      state: '',
      file: null
    }
  },
  computed: {
    currentDb() {
      return this.$store.state.db
    }
  },
  methods: {
    cancelImport() {
      // Nothing to clean up since we're using the existing database
    },

    async finish() {
      // Navigate to workspace if not already there
      if (this.$route.path !== '/workspace') {
        this.$router.push('/workspace')
      }
    },

    async checkFile(file) {
      this.state = 'dropping'

      // Only allow CSV, JSON, NDJSON, XLSX files
      if (fIo.isDatabase(file)) {
        // Show error message
        alert('Please use CSV, JSON, NDJSON or XLSX files only. For SQLite databases, use "Load Another Database".');
        return;
      } 
      
      const isJson = fIo.isJSON(file) || fIo.isNDJSON(file);
      const isXlsx = fIo.isXLSX(file);
      
      events.send('table.import', file.size, {
        from: isJson ? 'json' : (isXlsx ? 'xlsx' : 'csv'),
        add_table: true
      })

      this.file = file
      await this.$nextTick()
      const csvJsonImportModal = this.$refs.addCsvJson
      csvJsonImportModal.reset()
      csvJsonImportModal.preview().then(csvJsonImportModal.open)
    },
    
    browse() {
      fIo
        .getFileFromUser(fIo.FILTERS.DATA_FILES)
        .then(this.checkFile)
    },

    drop(event) {
      this.checkFile(event.dataTransfer.files[0])
    }
  }
}
</script>

<style scoped>
.table-uploader-container {
  position: relative;
}
.drop-area-container {
  display: inline-block;
  border: 1px dashed var(--color-border);
  padding: 8px;
  border-radius: var(--border-radius-big);
  height: 100%;
  width: 100%;
  box-sizing: border-box;
}

.drop-area {
  background-color: var(--color-bg-light-3);
  border-radius: var(--border-radius-big);
  color: var(--color-text-base);
  font-size: 13px;
  text-align: center;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;
}
</style> 