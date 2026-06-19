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

import CreatePermissionModal from './permission.create'
import UpdatePermissionModal from './permission.update'
import type { IPermission } from '../../../types/permission'
import { deletePermissionApi, getPermissionsApi } from '../../../services/permission-service'

// HTTP method badge colors
const METHOD_COLOR: Record<string, string> = {
  GET: 'blue', POST: 'green', PUT: 'orange', DELETE: 'red', PATCH: 'purple',
}

const PermissionTable = () => {
  const actionRef = useRef<ActionType | null>(null)
  const pageRef = useRef({ current: 1, pageSize: 10 })
  const { notification } = App.useApp()

  const [openCreate, setOpenCreate] = useState(false)
  const [openUpdate, setOpenUpdate] = useState(false)
  const [editRow, setEditRow] = useState<IPermission | null>(null)

  const reload = () => actionRef.current?.reload()

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await deletePermissionApi(id)
      notification.success({ message: 'Thành công', description: 'Xóa quyền hạn thành công', duration: 2 })
      reload()
    } catch (err: any) {
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Xóa quyền hạn thất bại',
        duration: 3,
      })
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: ProColumns<IPermission>[] = [
    {
      title: 'STT',
      key: 'index',
      width: 56,
      hideInSearch: true,
      render: (_t, _r, i) => i + 1 + (pageRef.current.current - 1) * pageRef.current.pageSize,
    },
    {
      title: 'Tên quyền hạn',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: 'Phương thức',
      dataIndex: 'method',
      width: 110,
      render: (_, r) => <Tag color={METHOD_COLOR[r.method] ?? 'default'} style={{ fontWeight: 600 }}>{r.method}</Tag>,
      valueType: 'select',
      valueEnum: {
        GET: { text: 'GET', status: 'Processing' },
        POST: { text: 'POST', status: 'Success' },
        PUT: { text: 'PUT', status: 'Warning' },
        DELETE: { text: 'DELETE', status: 'Error' },
        PATCH: { text: 'PATCH', status: 'Default' },
      },
      fieldProps: { placeholder: 'Chọn phương thức', allowClear: true },
    },
    {
      title: 'Đường dẫn API',
      dataIndex: 'apiPath',
      copyable: true,
      ellipsis: true,
      hideInSearch: true,  // backend dùng searchTerm chung, không filter riêng apiPath
    },
    {
      title: 'Module',
      dataIndex: 'module',
      width: 140,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdDate',
      hideInSearch: true,
      width: 130,
      sorter: true,
      render: (_d, r) => r.createdDate ? dayjs(r.createdDate).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Ngày sửa',
      dataIndex: 'lastModifiedDate',
      hideInSearch: true,
      width: 130,
      sorter: true,
      render: (_d, r) => r.lastModifiedDate ? dayjs(r.lastModifiedDate).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Thao tác',
      hideInSearch: true,
      fixed: 'right',
      width: 120,
      align: 'center',
      render: (_v, entity) => (
        <Space size={12}>
          <Access permission={All_PERMISSIONS.PERMISSIONS.UPDATE} hideChildren={true}>
            <EditOutlined
              style={{ fontSize: 17, color: '#fa8c16', cursor: 'pointer' }}
              onClick={() => { setEditRow(entity); setOpenUpdate(true) }}
            />
          </Access>
          <Access permission={All_PERMISSIONS.PERMISSIONS.DELETE} hideChildren={true}>
            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc chắn muốn xóa quyền hạn này?"
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

  // ── Build query string ────────────────────────────────────────────────────
  // Khớp với backend: PermissionFilterRequest
  //   searchTerm, module, method, sortBy, isDescending, pageNumber, pageSize
  const buildQuery = (params: any, sort: Partial<Record<string, SortOrder>>) => {
    const sp = new URLSearchParams()
    sp.set('pageNumber', String(params.current ?? 1))
    sp.set('pageSize', String(params.pageSize ?? 10))

    // Tìm theo tên → searchTerm
    if (params.name) sp.set('searchTerm', params.name)
    if (params.module) sp.set('module', params.module)
    if (params.method) sp.set('method', params.method)

    // Sắp xếp → sortBy + isDescending
    const sortEntry = sort ? Object.entries(sort).find(([, order]) => !!order) : null
    if (sortEntry) {
      const [field, order] = sortEntry
      sp.set('sortBy', field)
      sp.set('isDescending', order === 'descend' ? 'true' : 'false')
    } else {
      // Mặc định: mới nhất trước
      sp.set('sortBy', 'createdDate')
      sp.set('isDescending', 'true')
    }
    return sp.toString()
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Access permission={All_PERMISSIONS.PERMISSIONS.GET_PAGINATE} hideChildren={false}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={ADMIN_BREADCRUMBS.permissions.map(item => ({
          title: item.href ? <Link to={item.href}>{item.title}</Link> : item.title
        }))}
      />
      <ProTable<IPermission>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        cardBordered
        headerTitle="Danh sách Quyền hạn"
        toolBarRender={() => [
          <Access key="create" permission={All_PERMISSIONS.PERMISSIONS.CREATE} hideChildren={true}>
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
            const res = await getPermissionsApi(query)
            return {
              data: res.data?.result ?? [],
              success: true,
              total: res.data?.meta?.total ?? 0,
            }
          } catch {
            return { data: [], success: false, total: 0 }
          }
        }}
        pagination={{
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          defaultPageSize: 10,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} quyền hạn`,
        }}
        scroll={{ x: 'max-content' }}
      />

      <CreatePermissionModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSuccess={() => { setOpenCreate(false); reload() }}
      />
      <UpdatePermissionModal
        open={openUpdate}
        onOpenChange={setOpenUpdate}
        data={editRow}
        onSuccess={() => { setOpenUpdate(false); setEditRow(null); reload() }}
      />
    </Access>
  )
}

export default PermissionTable
