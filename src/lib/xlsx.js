import * as XLSX from 'xlsx'

export default {
  parse(file, config = {}) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // 获取第一个工作表
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          
          // 获取工作表的范围
          const range = XLSX.utils.decode_range(worksheet['!ref'])
          
          // 查找真正的数据开始行（跳过合并单元格的标题）
          let dataStartRow = range.s.r
          let headers = []
          let maxColumns = 0
          
          // 首先找到第一个非合并单元格的行作为表头
          let headerRow = -1
          let firstNonEmptyCol = -1
          let lastNonEmptyCol = -1
          
          for (let row = range.s.r; row <= range.e.r; row++) {
            let isMergedRow = false
            let hasNonMergedCell = false
            let rowFirstNonEmptyCol = -1
            let rowLastNonEmptyCol = -1
            
            for (let col = range.s.c; col <= range.e.c; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
              const cell = worksheet[cellAddress]
              
              // 检查是否是合并单元格
              const isMergedCell = worksheet['!merges']?.some(merge => {
                return row >= merge.s.r && row <= merge.e.r && col >= merge.s.c && col <= merge.e.c
              })
              
              if (isMergedCell) {
                isMergedRow = true
              } else if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
                hasNonMergedCell = true
                if (rowFirstNonEmptyCol === -1) rowFirstNonEmptyCol = col
                rowLastNonEmptyCol = col
              }
            }
            
            // 如果这一行不是完全由合并单元格组成，且有非空单元格，则认为是表头行
            if (!isMergedRow && hasNonMergedCell) {
              headerRow = row
              firstNonEmptyCol = rowFirstNonEmptyCol
              lastNonEmptyCol = rowLastNonEmptyCol
              break
            }
          }
          
          // 如果找到了表头行，从下一行开始处理数据
          if (headerRow !== -1) {
            dataStartRow = headerRow + 1
            
            // 处理表头行
            const headerData = []
            for (let col = range.s.c; col <= range.e.c; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col })
              const cell = worksheet[cellAddress]
              if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
                headerData.push(cell.v.toString().trim())
              }
            }
            headers = headerData
            maxColumns = headerData.length
          } else {
            // 如果没有找到合适的表头行，使用默认列名
            headers = Array.from({ length: range.e.c - range.s.c + 1 }, (_, i) => `Column${i + 1}`)
            maxColumns = headers.length
          }
          
          // 准备数据
          const result = {
            data: {
              columns: headers,
              values: {}
            },
            hasErrors: false,
            messages: [],
            rowCount: 0
          }
          
          // 初始化每列的数据数组
          headers.forEach(header => {
            result.data.values[header] = []
          })
          
          // 处理数据行
          const rows = []
          for (let row = dataStartRow; row <= range.e.r; row++) {
            const rowData = []
            let hasData = false
            let nonEmptyCells = 0
            let rowFirstNonEmptyCol = -1
            let rowLastNonEmptyCol = -1
            
            // 检查这一行是否有数据
            for (let col = range.s.c; col <= range.e.c; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
              const cell = worksheet[cellAddress]
              
              // 检查是否是合并单元格
              const isMergedCell = worksheet['!merges']?.some(merge => {
                return row >= merge.s.r && row <= merge.e.r && col >= merge.s.c && col <= merge.e.c
              })
              
              // 如果是合并单元格，且不是主单元格，则跳过
              if (isMergedCell) {
                const isMainCell = worksheet['!merges']?.some(merge => {
                  return row === merge.s.r && col === merge.s.c
                })
                if (!isMainCell) {
                  rowData.push(null)
                  continue
                }
              }
              
              if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
                hasData = true
                nonEmptyCells++
                if (rowFirstNonEmptyCol === -1) rowFirstNonEmptyCol = col
                rowLastNonEmptyCol = col
                rowData.push(cell.v)
              } else {
                rowData.push(null)
              }
            }
            
            // 如果这一行有数据，且不是空行
            if (hasData && rowData.some(val => val !== null)) {
              const currentRowColumns = rowLastNonEmptyCol - rowFirstNonEmptyCol + 1
              if (currentRowColumns >= maxColumns) {
                // 如果行数据长度超过最大列数，截取到最大列数
                const validData = rowData.slice(rowFirstNonEmptyCol, rowFirstNonEmptyCol + maxColumns)
                rows.push(validData)
              }
            }
          }
          
          // 填充数据
          rows.forEach(row => {
            row.forEach((value, index) => {
              if (index < headers.length) {
                result.data.values[headers[index]].push(value)
              }
            })
          })
          
          result.rowCount = rows.length
          
          // 添加一些提示信息
          if (dataStartRow > 0) {
            result.messages.push({
              type: 'info',
              message: `跳过了 ${dataStartRow} 行标题数据`
            })
          }
          
          // 添加列数信息
          result.messages.push({
            type: 'info',
            message: `使用 ${maxColumns} 列作为有效数据列`
          })
          
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Problem parsing XLSX file.'))
      }
      
      reader.readAsArrayBuffer(file)
    })
  },
  
  serialize(result) {
    if (!result || !result.values || !result.columns || result.columns.length === 0) {
      return null
    }
    
    // 创建工作表数据
    const wsData = []
    
    // 添加表头行
    wsData.push(result.columns)
    
    // 添加数据行
    const rowCount = result.values[result.columns[0]].length
    for (let i = 0; i < rowCount; i++) {
      const row = []
      for (const col of result.columns) {
        row.push(result.values[col][i])
      }
      wsData.push(row)
    }
    
    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    
    // 创建工作簿
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Query Result')
    
    // 生成xlsx文件
    const xlsxData = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    
    return new Blob([xlsxData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }
} 