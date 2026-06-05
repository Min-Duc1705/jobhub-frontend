import { useRef, useState } from 'react'
import { ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Badge, Breadcrumb, Button, Popconfirm, Space, Tag, Tooltip } from 'antd'
import type { SortOrder } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'

import Access from '../../auth/Access'
import { All_PERMISSIONS } from '../../../types/permissions-util'
import { ADMIN_BREADCRUMBS } from '../../../types/breadcum'

import CreateAccountModal from './account.create'
import UpdateAccountModal from './account.update'
import type { IUser, UserStatus } from '../../../types/account'
import { USER_STATUS_LABEL, USER_STATUS_COLOR } from '../../../types/account'
import { getUsersApi, deleteUserApi, importUsersApi } from '../../../services/account-service'
import ImportModal from '../../shared/common/ImportModal'
import { FileExcelOutlined } from '@ant-design/icons'

const AccountTable = () => {
  const actionRef = useRef<ActionType | null>(null)
  const pageRef   = useRef({ current: 1, pageSize: 10 })
  const { notification } = App.useApp()

  const [openCreate, setOpenCreate] = useState(false)
  const [openUpdate, setOpenUpdate] = useState(false)
  const [openImport, setOpenImport] = useState(false)
  const [editRow,    setEditRow]    = useState<IUser | null>(null)

  const reload = () => actionRef.current?.reload()

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await deleteUserApi(id)
      notification.success({ message: 'Thành công', description: 'Xóa tài khoản thành công', duration: 2 })
      reload()
    } catch (err: any) {
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Xóa tài khoản thất bại',
        duration: 3,
      })
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: ProColumns<IUser>[] = [
    {
      title: 'STT',
      key: 'index',
      width: 56,
      hideInSearch: true,
      render: (_t, _r, i) => i + 1 + (pageRef.current.current - 1) * pageRef.current.pageSize,
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      ellipsis: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      ellipsis: true,
      copyable: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      render: (_, r) => (
        <Badge
          color={(USER_STATUS_COLOR as any)[r.status] ?? 'default'}
          text={
            <Tag color={(USER_STATUS_COLOR as any)[r.status] ?? 'default'} style={{ margin: 0 }}>
              {USER_STATUS_LABEL[r.status as UserStatus] ?? r.status}
            </Tag>
          }
        />
      ),
      valueType: 'select',
      valueEnum: Object.fromEntries(
        (Object.keys(USER_STATUS_LABEL) as UserStatus[]).map(k => [
          k, { text: USER_STATUS_LABEL[k] },
        ])
      ),
      fieldProps: { placeholder: 'Chọn trạng thái', allowClear: true },
    },
    {
      title: 'Vai trò',
      dataIndex: ['role', 'name'],
      hideInSearch: true,
      width: 130,
      render: (_, r) => r.role
        ? <Tag color="blue">{r.role.name}</Tag>
        : <Tag>Không có</Tag>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdDate',
      hideInSearch: true,
      width: 120,
      sorter: true,
      render: (_d, r) => dayjs(r.createdDate).format('DD/MM/YYYY'),
    },
    {
      title: 'Ngày sửa',
      dataIndex: 'lastModifiedDate',
      hideInSearch: true,
      width: 120,
      sorter: true,
      render: (_d, r) => r.lastModifiedDate ? dayjs(r.lastModifiedDate).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Thao tác',
      hideInSearch: true,
      width: 90,
      align: 'center',
      render: (_v, entity) => (
        <Space size={10}>
          <Access permission={All_PERMISSIONS.USERS.UPDATE} hideChildren={true}>
            <Tooltip title="Chỉnh sửa tài khoản">
              <EditOutlined
                style={{ fontSize: 17, color: '#fa8c16', cursor: 'pointer' }}
                onClick={() => { setEditRow(entity); setOpenUpdate(true) }}
              />
            </Tooltip>
          </Access>
          <Access permission={All_PERMISSIONS.USERS.DELETE} hideChildren={true}>
            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc muốn xóa tài khoản này? Hành động không thể hoàn tác."
              onConfirm={() => handleDelete(entity.id)}
              okText="Xóa" cancelText="Hủy" placement="leftTop"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Xóa tài khoản">
                <DeleteOutlined style={{ fontSize: 17, color: '#ff4d4f', cursor: 'pointer' }} />
              </Tooltip>
            </Popconfirm>
          </Access>
        </Space>
      ),
    },
  ]

  // ── Build query ───────────────────────────────────────────────────────────
  const buildQuery = (params: any, sort: Partial<Record<string, SortOrder>>) => {
    const sp = new URLSearchParams()
    sp.set('pageNumber', String(params.current  ?? 1))
    sp.set('pageSize',   String(params.pageSize ?? 10))

    if (params.username) sp.set('searchTerm', params.username)
    if (params.status)   sp.set('status',     params.status)

    const sortEntry = sort ? Object.entries(sort).find(([, o]) => !!o) : null
    if (sortEntry) {
      sp.set('sortBy',       sortEntry[0])
      sp.set('isDescending', sortEntry[1] === 'descend' ? 'true' : 'false')
    } else {
      sp.set('sortBy',       'createdDate')
      sp.set('isDescending', 'true')
    }
    return sp.toString()
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Access permission={All_PERMISSIONS.USERS.GET_PAGINATE} hideChildren={false}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={ADMIN_BREADCRUMBS.accounts.map(item => ({
          title: item.href ? <Link to={item.href}>{item.title}</Link> : item.title
        }))}
      />
      <ProTable<IUser>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        cardBordered
        headerTitle="Danh sách Tài khoản hệ thống"
        toolBarRender={() => [
          <Access key="import" permission={All_PERMISSIONS.USERS.CREATE} hideChildren={true}>
            <Button
              type="default"
              icon={<FileExcelOutlined />}
              onClick={() => setOpenImport(true)}
            >
              Import Excel/CSV
            </Button>
          </Access>,
          <Access key="create" permission={All_PERMISSIONS.USERS.CREATE} hideChildren={true}>
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
            const res   = await getUsersApi(query)
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
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} tài khoản`,
        }}
        scroll={{ x: true }}
      />

      <CreateAccountModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSuccess={() => { setOpenCreate(false); reload() }}
      />
      <UpdateAccountModal
        open={openUpdate}
        data={editRow}
        onOpenChange={setOpenUpdate}
        onSuccess={() => { setOpenUpdate(false); setEditRow(null); reload() }}
      />
      <ImportModal
        open={openImport}
        onOpenChange={setOpenImport}
        title="Import danh sách tài khoản"
        onImport={importUsersApi}
        templateUrl="/templates/users_import_template.xlsx"
        templateName="users_import_template.xlsx"
        onSuccess={() => {
          notification.success({
            message: 'Thành công',
            description: 'Import danh sách tài khoản thành công',
            duration: 2,
          })
          reload()
        }}
      />
    </Access>
  )
}

export default AccountTable
