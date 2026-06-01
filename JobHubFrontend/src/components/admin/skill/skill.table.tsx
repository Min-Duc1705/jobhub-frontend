import { useRef, useState } from 'react'
import { ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Breadcrumb, Button, Popconfirm, Space, Tag } from 'antd'
import type { SortOrder } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'

import Access from '../../auth/Access'
import { All_PERMISSIONS } from '../../../types/permissions-util'
import { ADMIN_BREADCRUMBS } from '../../../types/breadcum'

import CreateSkillModal from './skill.create'
import UpdateSkillModal from './skill.update'
import type { ISkill }  from '../../../types/skill'
import { deleteSkillApi, getSkillsApi } from '../../../services/profile-service'

const SkillTable = () => {
  const actionRef = useRef<ActionType | null>(null)
  const pageRef   = useRef({ current: 1, pageSize: 10 })
  const { notification } = App.useApp()

  const [openCreate, setOpenCreate] = useState(false)
  const [openUpdate, setOpenUpdate] = useState(false)
  const [editRow,    setEditRow]    = useState<ISkill | null>(null)

  const reload = () => actionRef.current?.reload()

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await deleteSkillApi(id)
      notification.success({ message: 'Thành công', description: 'Xóa kỹ năng thành công', duration: 2 })
      reload()
    } catch (err: any) {
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Xóa kỹ năng thất bại',
        duration: 3,
      })
    }
  }

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns: ProColumns<ISkill>[] = [
    {
      title:       'STT',
      key:         'index',
      width:       60,
      hideInSearch: true,
      render:      (_t, _r, i) => i + 1 + (pageRef.current.current - 1) * pageRef.current.pageSize,
    },
    {
      title:     'Tên kỹ năng',
      dataIndex: 'name',
      ellipsis:  true,
      render:    (_, r) => <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px' }}>{r.name}</Tag>,
    },
    {
      title:        'Ngày tạo',
      dataIndex:    'createdDate',
      hideInSearch: true,
      width:        130,
      sorter:       true,
      render:       (_d, r) => r.createdDate ? dayjs(r.createdDate).format('DD/MM/YYYY') : '—',
    },
    {
      title:        'Ngày sửa',
      dataIndex:    'lastModifiedDate',
      hideInSearch: true,
      width:        130,
      sorter:       true,
      render:       (_d, r) => r.lastModifiedDate ? dayjs(r.lastModifiedDate).format('DD/MM/YYYY') : '—',
    },
    {
      title:        'Thao tác',
      hideInSearch: true,
      width:        90,
      align:        'center',
      render:       (_v, entity) => (
        <Space size={10}>
          <Access permission={All_PERMISSIONS.SKILLS.UPDATE} hideChildren={true}>
            <EditOutlined
              style={{ fontSize: 17, color: '#fa8c16', cursor: 'pointer' }}
              onClick={() => { setEditRow(entity); setOpenUpdate(true) }}
            />
          </Access>
          <Access permission={All_PERMISSIONS.SKILLS.DELETE} hideChildren={true}>
            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc chắn muốn xóa kỹ năng này?"
              onConfirm={() => handleDelete(entity.id ?? '')}
              okText="Xóa" cancelText="Hủy" placement="leftTop"
            >
              <DeleteOutlined style={{ fontSize: 17, color: '#ff4d4f', cursor: 'pointer' }} />
            </Popconfirm>
          </Access>
        </Space>
      ),
    },
  ]

  // ── Build query ─────────────────────────────────────────────────────────────
  // Khớp với backend: SkillFilterRequest
  //   searchTerm, sortBy, isDescending, pageNumber, pageSize
  const buildQuery = (params: any, sort: Partial<Record<string, SortOrder>>) => {
    const sp = new URLSearchParams()
    sp.set('pageNumber', String(params.current  ?? 1))
    sp.set('pageSize',   String(params.pageSize ?? 10))

    if (params.name) sp.set('searchTerm', params.name)

    const sortEntry = sort ? Object.entries(sort).find(([, o]) => !!o) : null
    if (sortEntry) {
      const [field, order] = sortEntry
      sp.set('sortBy',       field)
      sp.set('isDescending', order === 'descend' ? 'true' : 'false')
    } else {
      sp.set('sortBy',       'name')
      sp.set('isDescending', 'false')
    }
    return sp.toString()
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Access permission={All_PERMISSIONS.SKILLS.GET_PAGINATE} hideChildren={false}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={ADMIN_BREADCRUMBS.skills.map(item => ({
          title: item.href ? <Link to={item.href}>{item.title}</Link> : item.title
        }))}
      />
      <ProTable<ISkill>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        cardBordered
        headerTitle="Danh sách Kỹ năng"
        toolBarRender={() => [
          <Access key="create" permission={All_PERMISSIONS.SKILLS.CREATE} hideChildren={true}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpenCreate(true)}
            >
              Thêm mới
            </Button>
          </Access>,
        ]}
        search={{ labelWidth: 'auto', span: 6 }}
        request={async (params, sort) => {
          pageRef.current = { current: params.current ?? 1, pageSize: params.pageSize ?? 10 }
          try {
            const query = buildQuery(params, sort)
            const res   = await getSkillsApi(query)
            return {
              data:    res.data?.result ?? [],
              success: true,
              total:   res.data?.meta?.total ?? 0,
            }
          } catch {
            return { data: [], success: false, total: 0 }
          }
        }}
        pagination={{
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          defaultPageSize: 10,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} kỹ năng`,
        }}
        scroll={{ x: true }}
      />

      <CreateSkillModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSuccess={() => { setOpenCreate(false); reload() }}
      />
      <UpdateSkillModal
        open={openUpdate}
        onOpenChange={setOpenUpdate}
        data={editRow}
        onSuccess={() => { setOpenUpdate(false); setEditRow(null); reload() }}
      />
    </Access>
  )
}

export default SkillTable
