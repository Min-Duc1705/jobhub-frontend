import { useRef, useState, useEffect } from 'react'
import { ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Breadcrumb, Button, Popconfirm, Space, Tag } from 'antd'
import type { SortOrder } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'

import Access from '../../auth/Access'
import { All_PERMISSIONS } from '../../../types/permissions-util'
import { ADMIN_BREADCRUMBS } from '../../../types/breadcum'

import RoleModal from './role.modal'
import type { IPermission, PermissionGroup } from '../../../types/permission'
import type { IRole } from '../../../types/role'
import { getPermissionDropdownApi } from '../../../services/permission-service'
import { deleteRoleApi, getRolesApi } from '../../../services/role-service'

/** Group flat permission list by module */
const groupByModule = (perms: IPermission[]): PermissionGroup[] => {
  const map: Record<string, IPermission[]> = {}
  perms.forEach(p => { if (!map[p.module]) map[p.module] = []; map[p.module].push(p) })
  return Object.entries(map).map(([module, permissions]) => ({ module, permissions }))
}

const RoleTable = () => {
  const actionRef = useRef<ActionType | null>(null)
  const pageRef = useRef({ current: 1, pageSize: 10 })
  const { notification } = App.useApp()

  const [openModal, setOpenModal] = useState(false)
  const [editRole, setEditRole] = useState<IRole | null>(null)
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
  const [permsLoading, setPermsLoading] = useState(true)

  // Load all permissions once (for the role modal's permission picker)
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        setPermsLoading(true)
        const res = await getPermissionDropdownApi()
        if (alive && res.data) setPermissionGroups(groupByModule(res.data))
      } catch { /* silent */ }
      finally { if (alive) setPermsLoading(false) }
    }
    load()
    return () => { alive = false }
  }, [])

  const reload = () => actionRef.current?.reload()

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await deleteRoleApi(id)
      notification.success({ message: 'Thành công', description: 'Xóa role thành công', duration: 2 })
      reload()
    } catch (err: any) {
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Xóa role thất bại',
        duration: 3,
      })
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: ProColumns<IRole>[] = [
    {
      title: 'STT',
      key: 'index',
      width: 56,
      hideInSearch: true,
      render: (_t, _r, i) => i + 1 + (pageRef.current.current - 1) * pageRef.current.pageSize,
    },
    {
      title: 'Tên Role',
      dataIndex: 'name',
      sorter: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      width: 110,
      render: (_, r) => (
        <Tag color={r.isActive ? 'success' : 'error'}>
          {r.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
      valueType: 'select',
      valueEnum: {
        true: { text: 'Active', status: 'Success' },
        false: { text: 'Inactive', status: 'Error' },
      },
      fieldProps: { placeholder: 'Chọn trạng thái', allowClear: true },
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: 'Quyền hạn',
      dataIndex: 'permissions',
      hideInSearch: true,
      width: 80,
      align: 'center',
      render: (_, r) => (
        <Tag color="blue">{(r.permissions ?? []).length} quyền</Tag>
      ),
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
          <Access permission={All_PERMISSIONS.ROLES.UPDATE} hideChildren={true}>
            <EditOutlined
              style={{ fontSize: 17, color: '#fa8c16', cursor: 'pointer' }}
              onClick={() => { setEditRole(entity); setOpenModal(true) }}
            />
          </Access>
          <Access permission={All_PERMISSIONS.ROLES.DELETE} hideChildren={true}>
            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc chắn muốn xóa role này?"
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

  // ── Build query ───────────────────────────────────────────────────────────
  // Khớp với backend: RoleFilterRequest
  //   searchTerm, isActive, sortBy, isDescending, pageNumber, pageSize
  const buildQuery = (params: any, sort: Partial<Record<string, SortOrder>>) => {
    const sp = new URLSearchParams()
    sp.set('pageNumber', String(params.current ?? 1))
    sp.set('pageSize', String(params.pageSize ?? 10))

    // Tìm theo tên → searchTerm
    if (params.name) sp.set('searchTerm', params.name)

    // Lọc trạng thái (ProTable gửi string 'true'/'false')
    if (params.isActive !== undefined && params.isActive !== null && params.isActive !== '')
      sp.set('isActive', String(params.isActive))

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
    <Access permission={All_PERMISSIONS.ROLES.GET_PAGINATE} hideChildren={false}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={ADMIN_BREADCRUMBS.roles.map(item => ({
          title: item.href ? <Link to={item.href}>{item.title}</Link> : item.title
        }))}
      />
      <ProTable<IRole>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        cardBordered
        headerTitle="Danh sách Vai trò (Roles)"
        toolBarRender={() => [
          <Access key="create" permission={All_PERMISSIONS.ROLES.CREATE} hideChildren={true}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={permsLoading}
              disabled={permsLoading || permissionGroups.length === 0}
              onClick={() => { setEditRole(null); setOpenModal(true) }}
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
            const res = await getRolesApi(query)
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
          pageSizeOptions: ['10', '20', '50'],
          defaultPageSize: 10,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} roles`,
        }}
        scroll={{ x: 'max-content' }}
      />

      <RoleModal
        open={openModal}
        onOpenChange={v => { setOpenModal(v); if (!v) setEditRole(null) }}
        permissionGroups={permissionGroups}
        initialRole={editRole}
        onSuccess={() => { setOpenModal(false); setEditRole(null); reload() }}
      />
    </Access>
  )
}

export default RoleTable
