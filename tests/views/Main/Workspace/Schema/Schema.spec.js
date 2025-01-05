import { expect } from 'chai'
import sinon from 'sinon'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import actions from '@/store/actions'
import mutations from '@/store/mutations'
import Schema from '@/views/Main/Workspace/Schema'
import TableDescription from '@/views/Main/Workspace/Schema/TableDescription'
import database from '@/lib/database'
import fIo from '@/lib/utils/fileIo'
import csv from '@/lib/csv'

describe('Schema.vue', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('Renders DB name on initial', () => {
    // mock store state
    const state = {
      db: {
        dbName: 'fooDB'
      }
    }
    const store = createStore({ state })

    // mout the component
    const wrapper = mount(Schema, {
      global: {
        plugins: [store]
      }
    })

    // check DB name and schema visibility
    expect(wrapper.find('.db-name').text()).to.equal('fooDB')
    expect(wrapper.find('.schema').isVisible()).to.equal(true)
  })

  it('Schema visibility is toggled when click on DB name', async () => {
    // mock store state
    const state = {
      db: {
        dbName: 'fooDB'
      }
    }
    const store = createStore({ state })

    // mout the component
    const wrapper = mount(Schema, {
      global: {
        plugins: [store]
      }
    })

    // click and check visibility
    await wrapper.find('.db-name').trigger('click')
    expect(wrapper.find('.schema').isVisible()).to.equal(false)
    await wrapper.find('.db-name').trigger('click')
    expect(wrapper.find('.schema').isVisible()).to.equal(true)
  })

  it('Schema filter', async () => {
    // mock store state
    const state = {
      db: {
        dbName: 'fooDB',
        schema: [
          {
            name: 'foo',
            columns: [
              { name: 'id', type: 'INTEGER' },
              { name: 'title', type: 'NVARCHAR(24)' }
            ]
          },
          {
            name: 'bar',
            columns: [
              { name: 'id', type: 'INTEGER' },
              { name: 'price', type: 'INTEGER' }
            ]
          },
          {
            name: 'foobar',
            columns: [
              { name: 'id', type: 'INTEGER' },
              { name: 'price', type: 'INTEGER' }
            ]
          }
        ]
      }
    }
    const store = createStore({ state })

    // mount the component
    const wrapper = mount(Schema, {
      global: {
        plugins: [store]
      }
    })

    // apply filters and check the list of tables
    await wrapper.find('#schema-filter input').setValue('foo')
    let tables = wrapper.findAllComponents(TableDescription)
    expect(tables).to.have.lengthOf(2)
    expect(tables[0].vm.name).to.equal('foo')
    expect(tables[1].vm.name).to.equal('foobar')

    await wrapper.find('#schema-filter input').setValue('bar')
    tables = wrapper.findAllComponents(TableDescription)
    expect(tables).to.have.lengthOf(2)
    expect(tables[0].vm.name).to.equal('bar')
    expect(tables[1].vm.name).to.equal('foobar')

    await wrapper.find('#schema-filter input').setValue('')
    tables = wrapper.findAllComponents(TableDescription)
    expect(tables).to.have.lengthOf(3)
    expect(tables[0].vm.name).to.equal('foo')
    expect(tables[1].vm.name).to.equal('bar')
    expect(tables[2].vm.name).to.equal('foobar')
  })

  it('exports db', async () => {
    const state = {
      db: {
        dbName: 'fooDB',
        export: sinon.stub().resolves()
      }
    }
    const store = createStore({ state })
    const wrapper = mount(Schema, {
      global: {
        plugins: [store]
      }
    })

    await wrapper.findComponent({ name: 'export-icon' }).find('svg').trigger('click')
    expect(state.db.export.calledOnceWith('fooDB'))
  })

  it('adds table', async () => {
    const file = new File([], 'test.csv')
    sinon.stub(fIo, 'getFileFromUser').resolves(file)

    sinon.stub(csv, 'parse').resolves({
      delimiter: '|',
      data: {
        columns: ['col1', 'col2'],
        values: {
          col1: [1],
          col2: ['foo']
        }
      },
      hasErrors: false,
      messages: []
    })

    const state = {
      db: database.getNewDatabase(),
      tabs: []
    }
    state.db.dbName = 'db'
    state.db.execute('CREATE TABLE foo(id)')
    state.db.refreshSchema()
    sinon.spy(state.db, 'refreshSchema')

    const store = createStore({ state, actions, mutations })
    const wrapper = mount(Schema, {
      global: {
        plugins: [store]
      }
    })
    sinon.spy(wrapper.vm.$refs.addCsvJson, 'preview')
    sinon.spy(wrapper.vm, 'addCsvJson')
    sinon.spy(wrapper.vm.$refs.addCsvJson, 'loadToDb')

    await wrapper.findComponent({ name: 'add-table-icon' }).find('svg').trigger('click')
    await wrapper.vm.$refs.addCsvJson.preview.returnValues[0]
    await wrapper.vm.addCsvJson.returnValues[0]
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-modal="addCsvJson"]').exists()).to.equal(true)
    await wrapper.find('#import-start').trigger('click')
    await wrapper.vm.$refs.addCsvJson.loadToDb.returnValues[0]
    await wrapper.find('#import-finish').trigger('click')
    expect(wrapper.find('[data-modal="addCsvJson"]').exists()).to.equal(false)
    await state.db.refreshSchema.returnValues[0]

    expect(wrapper.vm.$store.state.db.schema).to.eql([
      { name: 'foo', columns: [{ name: 'id', type: 'N/A' }] },
      { name: 'test', columns: [{ name: 'col1', type: 'REAL' }, { name: 'col2', type: 'TEXT' }] }
    ])

    const res = await wrapper.vm.$store.state.db.execute('select * from test')
    expect(res.values).to.eql({
      col1: [1],
      col2: ['foo']
    })
  })
})
