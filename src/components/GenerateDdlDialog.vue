<template>
  <modal
    :modalId="dialogName"
    class="dialog"
    contentClass="ddl-modal"
    scrollable
    :clickToClose="false"
  >
    <div class="dialog-header">
      SQL CREATE TABLE Statements
      <close-icon @click="closeDialog" />
    </div>
    <div class="dialog-body">
      <div v-if="loading" class="loading-container">
        <loading-indicator :size="30" />
        <span>Generating SQL statements...</span>
      </div>
      <div v-else>
        <div v-if="sqlStatements.length === 0" class="no-tables">
          No tables found in the current database.
        </div>
        <div v-else>
          <div class="sql-container">
            <pre class="sql-code">{{ formattedSql }}</pre>
          </div>
        </div>
      </div>
    </div>
    <div class="dialog-buttons-container">
      <div class="copy-status" v-if="copyStatus">{{ copyStatus }}</div>
      <div class="button-group">
        <button
          class="secondary"
          @click="closeDialog"
        >
          Close
        </button>
        <button
          class="primary"
          :disabled="sqlStatements.length === 0"
          @click="copyToClipboard"
        >
          Copy to Clipboard
        </button>
      </div>
    </div>
  </modal>
</template>

<script>
import CloseIcon from '@/components/svg/close'
import LoadingIndicator from '@/components/LoadingIndicator'

export default {
  name: 'GenerateDdlDialog',
  components: {
    CloseIcon,
    LoadingIndicator
  },
  props: {
    dialogName: {
      type: String,
      required: true
    },
    db: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      sqlStatements: [],
      copyStatus: ''
    }
  },
  computed: {
    formattedSql() {
      return this.sqlStatements.join('\n\n');
    }
  },
  methods: {
    async generateDdl() {
      this.loading = true;
      this.sqlStatements = [];
      try {
        if (!this.db || !this.db.schema) {
          return;
        }
        
        for (const table of this.db.schema) {
          try {
            // 避免SQL注入
            const tableName = table.name.replace(/'/g, "''");
            // 获取表的CREATE TABLE语句
            const result = await this.db.execute(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
            if (result && result.values && result.values.sql && result.values.sql.length > 0) {
              // 添加分号并确保有结束符号
              let sqlStatement = result.values.sql[0];
              if (!sqlStatement.trim().endsWith(';')) {
                sqlStatement += ';';
              }
              this.sqlStatements.push(sqlStatement);
            }
          } catch (error) {
            console.error(`Error getting DDL for table ${table.name}:`, error);
          }
        }
      } catch (error) {
        console.error('Error generating DDL:', error);
      } finally {
        this.loading = false;
      }
    },
    copyToClipboard() {
      if (navigator.clipboard && this.formattedSql) {
        navigator.clipboard.writeText(this.formattedSql)
          .then(() => {
            this.copyStatus = 'SQL statements copied to clipboard!';
            setTimeout(() => {
              this.copyStatus = '';
            }, 3000);
          })
          .catch((err) => {
            console.error('Failed to copy: ', err);
            this.copyStatus = 'Failed to copy to clipboard';
          });
      }
    },
    closeDialog() {
      this.$modal.hide(this.dialogName);
    },
    open() {
      this.generateDdl();
      this.$modal.show(this.dialogName);
    }
  }
}
</script>

<style>
.ddl-modal {
  width: 80%;
  max-width: 1000px;
  margin: auto;
  left: 0 !important;
}
</style>

<style scoped>
.dialog-body {
  padding-bottom: 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 20px;
}

.sql-container {
  max-height: 500px;
  overflow-y: auto;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
}

.sql-code {
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 13px;
  color: #333;
}

.no-tables {
  text-align: center;
  padding: 50px 0;
  color: #666;
}

.copy-status {
  color: var(--color-success);
  font-size: 13px;
  margin-right: auto;
}

.button-group {
  display: flex;
  gap: 10px;
}
</style> 