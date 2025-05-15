<template>
  <div id="schema-container">
    <div id="schema-filter">
      <text-field v-model="filter" placeholder="Search table" width="100%" />
    </div>
    <div id="db">
      <div class="db-name" @click="schemaVisible = !schemaVisible">
        <tree-chevron v-show="schema.length > 0" :expanded="schemaVisible" />
        {{ dbName }}
      </div>
      <db-uploader id="db-edit" type="small" />
      <export-icon tooltip="Export database" @click="exportToFile" />
      <add-table-icon @click="addCsvJson" />
      <generate-ddl-icon @click="showGenerateDdl" />
    </div>
    <div v-show="schemaVisible" class="schema">
      <table-description
        v-for="table in schema"
        :key="table.name"
        :name="table.name"
        :columns="table.columns"
      />
    </div>

    <!--Parse csv or json dialog  -->
    <csv-json-import
      ref="addCsvJson"
      :file="file"
      :db="$store.state.db"
      dialogName="addCsvJson"
    />
    
    <!--Generate DDL dialog  -->
    <generate-ddl-dialog
      ref="generateDdl"
      :db="$store.state.db"
      dialogName="generateDdl"
    />
  </div>
</template>

<script>
import fIo from '@/lib/utils/fileIo'
import events from '@/lib/utils/events'
import TableDescription from './TableDescription'
import TextField from '@/components/TextField'
import TreeChevron from '@/components/svg/treeChevron'
import DbUploader from '@/components/DbUploader'
import ExportIcon from '@/components/svg/export'
import AddTableIcon from '@/components/svg/addTable'
import GenerateDdlIcon from '@/components/svg/generateDdl'
import CsvJsonImport from '@/components/CsvJsonImport'
import GenerateDdlDialog from '@/components/GenerateDdlDialog'

export default {
  name: 'Schema',
  components: {
    TableDescription,
    TextField,
    TreeChevron,
    DbUploader,
    ExportIcon,
    AddTableIcon,
    GenerateDdlIcon,
    CsvJsonImport,
    GenerateDdlDialog
  },
  data() {
    return {
      schemaVisible: true,
      filter: null,
      file: null
    }
  },
  computed: {
    schema() {
      if (!this.$store.state.db.schema) {
        return []
      }

      return !this.filter
        ? this.$store.state.db.schema
        : this.$store.state.db.schema.filter(
            table =>
              table.name.toUpperCase().indexOf(this.filter.toUpperCase()) !== -1
          )
    },
    dbName() {
      return this.$store.state.db.dbName
    }
  },
  methods: {
    exportToFile() {
      this.$store.state.db.export(`${this.dbName}.sqlite`)
    },
    async addCsvJson() {
      this.file = await fIo.getFileFromUser(fIo.FILTERS.DATA_FILES)
      await this.$nextTick()
      const csvJsonImportModal = this.$refs.addCsvJson
      csvJsonImportModal.reset()
      await csvJsonImportModal.preview()
      csvJsonImportModal.open()

      const isJson = fIo.isJSON(this.file) || fIo.isNDJSON(this.file)
      const isXlsx = fIo.isXLSX(this.file)
      events.send('database.import', this.file.size, {
        from: isJson ? 'json' : (isXlsx ? 'xlsx' : 'csv'),
        new_db: false
      })
    },
    showGenerateDdl() {
      if (this.$store.state.db && this.$store.state.db.schema && this.$store.state.db.schema.length > 0) {
        this.$refs.generateDdl.open()
      } else {
        alert('No tables found in the database.')
      }
    }
  }
}
</script>

<style scoped>
#schema-container {
  position: relative;
  padding-bottom: 24px;
}

.schema {
  margin-left: 12px;
  padding: 0 12px;
}
#schema-filter {
  padding: 32px 12px;
  position: sticky;
  position: -webkit-sticky;
  top: 0;
  width: 100%;
  height: 100px;
  box-sizing: border-box;
  background-image: linear-gradient(white 73%, rgba(255, 255, 255, 0));
  z-index: 2;
}
.schema,
.db-name {
  color: var(--color-text-base);
  font-size: 13px;
  white-space: nowrap;
}
#db {
  display: flex;
  align-items: center;
  margin-top: -5px;
  padding: 0 12px;
  gap: 8px;
}

.db-name {
  cursor: pointer;
  margin-right: 6px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.db-name:hover .chevron-icon path,
:deep(.table-name:hover .chevron-icon path) {
  fill: var(--color-gray-dark);
}
</style>
