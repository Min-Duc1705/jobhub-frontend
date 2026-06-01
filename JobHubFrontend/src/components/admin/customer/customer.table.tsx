import { useRef, useState } from 'react'
import { ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { App, Avatar, Breadcrumb, Popconfirm, Space, Tag, Tooltip } from 'antd'
import type { SortOrder } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'

import Access from '../../auth/Access'
import { All_PERMISSIONS } from '../../../types/permissions-util'
import { ADMIN_BREADCRUMBS } from '../../../types/breadcum'

import UpdateCustomerModal from './customer.update'
import type { ICustomer } from '../../../types/customer'
import { deleteCustomerByIdApi, getCustomersApi } from '../../../services/customer-service'

const TYPE_COLOR: Record<string, string> = {
  CANDIDATE: 'blue',
  EMPLOYER:  'green',
}
const TYPE_LABEL: Record<string, string> = {
  CANDIDATE: 'Ứng viên',
  EMPLOYER:  'Nhà tuyển dụng',
}

const CustomerTable = () => {
  const actionRef = useRef<ActionType | null>(null)
  const pageRef   = useRef({ current: 1, pageSize: 10 })
  const { notification } = App.useApp()

  const [openUpdate, setOpenUpdate] = useState(false)
  const [editRow,    setEditRow]    = useState<ICustomer | null>(null)

  const reload = () => actionRef.current?.reload()

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await deleteCustomerByIdApi(id)
      notification.success({ message: 'Thành công', description: 'Xóa hồ sơ thành công', duration: 2 })
      reload()
    } catch (err: any) {
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Xóa hồ sơ thất bại',
        duration: 3,
      })
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: ProColumns<ICustomer>[] = [
    {
      title: 'STT',
      key: 'index',
      width: 56,
      hideInSearch: true,
      render: (_t, _r, i) => i + 1 + (pageRef.current.current - 1) * pageRef.current.pageSize,
    },
    {
      title: 'Ảnh đại diện',
      dataIndex: 'avatar',
      hideInSearch: true,
      width: 80,
      align: 'center',
      render: (_, r) => (
        <Avatar
          src={r.avatar || undefined}
          style={{ backgroundColor: '#1677ff' }}
        >
          {!r.avatar && (r.fullName?.[0]?.toUpperCase() ?? '?')}
        </Avatar>
      ),
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      ellipsis: true,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      hideInSearch: true,
      width: 130,
      render: (_, r) => r.phone ?? '—',
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      width: 150,
      render: (_, r) => (
        <Tag color={TYPE_COLOR[r.type] ?? 'default'}>
          {TYPE_LABEL[r.type] ?? r.type}
        </Tag>
      ),
      valueType: 'select',
      valueEnum: {
        CANDIDATE: { text: 'Ứng viên',        status: 'Processing' },
        EMPLOYER:  { text: 'Nhà tuyển dụng',  status: 'Success'    },
      },
      fieldProps: { placeholder: 'Chọn loại', allowClear: true },
    },
    {
      title: 'Kinh nghiệm (năm)',
      dataIndex: 'yearsOfExperience',
      hideInSearch: true,
      width: 140,
      align: 'right',
      render: (_, r) => r.type === 'CANDIDATE'
        ? (r.yearsOfExperience != null ? `${r.yearsOfExperience} năm` : '—')
        : '—',
    },
    {
      title: 'Vị trí',
      dataIndex: 'position',
      hideInSearch: true,
      width: 130,
      render: (_, r) => r.type === 'EMPLOYER' ? (r.position ?? '—') : '—',
    },
    {
      title: 'Ngày tạo',
      key: 'createdDate',
      dataIndex: 'createdDate',
      hideInSearch: true,
      width: 130,
      sorter: true,
      render: (_d, r: any) => r.createdDate ? dayjs(r.createdDate).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Thao tác',
      hideInSearch: true,
      width: 90,
      align: 'center',
      render: (_v, entity) => (
        <Space size={10}>
          <Access permission={All_PERMISSIONS.CUSTOMERS.UPDATE} hideChildren={true}>
            <Tooltip title="Chỉnh sửa hồ sơ">
              <EditOutlined
                style={{ fontSize: 17, color: '#fa8c16', cursor: 'pointer' }}
                onClick={() => { setEditRow(entity); setOpenUpdate(true) }}
              />
            </Tooltip>
          </Access>
          <Access permission={All_PERMISSIONS.CUSTOMERS.DELETE} hideChildren={true}>
            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc chắn muốn xóa hồ sơ này? Hành động không thể hoàn tác."
              onConfirm={() => handleDelete(entity.id ?? '')}
              okText="Xóa" cancelText="Hủy" placement="leftTop"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Xóa hồ sơ">
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

    if (params.fullName) sp.set('searchTerm', params.fullName)
    if (params.type)     sp.set('type',       params.type)

    const sortEntry = sort ? Object.entries(sort).find(([, o]) => !!o) : null
    if (sortEntry) {
      const [field, order] = sortEntry
      sp.set('sortBy',       field)
      sp.set('isDescending', order === 'descend' ? 'true' : 'false')
    } else {
      sp.set('sortBy',       'createdDate')
      sp.set('isDescending', 'true')
    }
    return sp.toString()
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Access permission={All_PERMISSIONS.PROFILES.GET_PAGINATE} hideChildren={false}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={ADMIN_BREADCRUMBS.customers.map(item => ({
          title: item.href ? <Link to={item.href}>{item.title}</Link> : item.title
        }))}
      />
      <ProTable<ICustomer>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        cardBordered
        headerTitle="Danh sách Customer"
        search={{ labelWidth: 'auto', span: 6 }}
        request={async (params, sort) => {
          pageRef.current = { current: params.current ?? 1, pageSize: params.pageSize ?? 10 }
          try {
            const query = buildQuery(params, sort)
            const res   = await getCustomersApi(query)
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
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} hồ sơ`,
        }}
        scroll={{ x: true }}
      />

      <UpdateCustomerModal
        open={openUpdate}
        onOpenChange={setOpenUpdate}
        data={editRow}
        onSuccess={() => { setOpenUpdate(false); setEditRow(null); reload() }}
      />
    </Access>
  )
}

export default CustomerTable
