import { useRef, useState } from 'react'
import { ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components'
import { DeleteOutlined, EditOutlined, PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { App, Avatar, Breadcrumb, Button, Image, Popconfirm, Space, Tag, Tooltip } from 'antd'
import type { SortOrder } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'

import Access from '../../auth/Access'
import { All_PERMISSIONS } from '../../../types/permissions-util'
import { ADMIN_BREADCRUMBS } from '../../../types/breadcum'

import CreateCompanyModal  from './company.create'
import UpdateCompanyModal  from './company.update'
import type { ICompany }  from '../../../types/company'
import { deleteCompanyApi, getCompaniesApi, verifyCompanyApi } from '../../../services/company-service'

const SIZE_LABEL: Record<string, string> = {
  STARTUP:    'Startup (<50)',
  SME:        'Vừa (50-200)',
  ENTERPRISE: 'Lớn (200+)',
}

const SIZE_COLOR: Record<string, string> = {
  STARTUP:    'cyan',
  SME:        'blue',
  ENTERPRISE: 'purple',
}

const CompanyTable = () => {
  const actionRef = useRef<ActionType | null>(null)
  const pageRef   = useRef({ current: 1, pageSize: 10 })
  const { notification } = App.useApp()

  const [openCreate, setOpenCreate] = useState(false)
  const [openUpdate, setOpenUpdate] = useState(false)
  const [editRow,    setEditRow]    = useState<ICompany | null>(null)

  const reload = () => actionRef.current?.reload()

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await deleteCompanyApi(id)
      notification.success({ message: 'Thành công', description: 'Xóa công ty thành công', duration: 2 })
      reload()
    } catch (err: any) {
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Xóa công ty thất bại',
        duration: 3,
      })
    }
  }

  // ── Verify ────────────────────────────────────────────────────────────────
  const handleVerify = async (id: string) => {
    try {
      await verifyCompanyApi(id)
      notification.success({ message: 'Thành công', description: 'Xác minh công ty thành công', duration: 2 })
      reload()
    } catch (err: any) {
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Xác minh thất bại',
        duration: 3,
      })
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: ProColumns<ICompany>[] = [
    {
      title: 'STT',
      key: 'index',
      width: 56,
      hideInSearch: true,
      render: (_t, _r, i) => i + 1 + (pageRef.current.current - 1) * pageRef.current.pageSize,
    },
    {
      title: 'Logo',
      dataIndex: 'logo',
      width: 72,
      hideInSearch: true,
      render: (_, r) => r.logo ? (
        <Image
          src={r.logo}
          width={42}
          height={42}
          style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #f0f0f0', display: 'block' }}
          preview={{
            mask: (
              <span style={{ fontSize: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>zoom_in</span>
              </span>
            ),
          }}
          fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='42' height='42'%3E%3Crect width='42' height='42' rx='8' fill='%23e3e2e2'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='%23747783' font-family='sans-serif'%3E%F0%9F%8F%A2%3C/text%3E%3C/svg%3E"
        />
      ) : (
        <Avatar
          shape="square"
          size={42}
          style={{
            backgroundColor: '#002660',
            fontWeight: 700,
            fontSize: 16,
            borderRadius: 8,
          }}
        >
          {r.name?.charAt(0).toUpperCase()}
        </Avatar>
      ),
    },
    {
      title: 'Tên công ty',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: 'Ngành',
      dataIndex: 'industry',
      width: 130,
      ellipsis: true,
    },
    {
      title: 'Quy mô',
      dataIndex: 'companySize',
      width: 130,
      hideInSearch: true,
      render: (_, r) => r.companySize
        ? <Tag color={SIZE_COLOR[r.companySize] ?? 'default'}>{SIZE_LABEL[r.companySize] ?? r.companySize}</Tag>
        : '—',
    },
    {
      title: 'Xác minh',
      dataIndex: 'isVerified',
      width: 100,
      render: (_, r) => (
        <Tag color={r.isVerified ? 'success' : 'warning'}>
          {r.isVerified ? '✓ Đã xác minh' : '⏳ Chờ xác minh'}
        </Tag>
      ),
      valueType: 'select',
      valueEnum: {
        true:  { text: 'Đã xác minh',   status: 'Success' },
        false: { text: 'Chưa xác minh', status: 'Default' },
      },
      fieldProps: { placeholder: 'Chọn trạng thái', allowClear: true },
    },
    {
      title: 'Website',
      dataIndex: 'website',
      hideInSearch: true,
      width: 150,
      render: (_, r) => r.website
        ? <a href={r.website} target="_blank" rel="noopener noreferrer" style={{ color: '#1677ff' }}>{r.website}</a>
        : '—',
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
      width: 110,
      align: 'center',
      render: (_v, entity) => (
        <Space size={10}>
          {!entity.isVerified && (
            <Access permission={All_PERMISSIONS.COMPANIES.VERIFY} hideChildren={true}>
              <Tooltip title="Xác minh công ty">
                <Popconfirm
                  title="Xác nhận xác minh"
                  description="Xác minh công ty này?"
                  onConfirm={() => handleVerify(entity.id ?? '')}
                  okText="Xác minh" cancelText="Hủy" placement="leftTop"
                >
                  <SafetyCertificateOutlined style={{ fontSize: 17, color: '#52c41a', cursor: 'pointer' }} />
                </Popconfirm>
              </Tooltip>
            </Access>
          )}
          <Access permission={All_PERMISSIONS.COMPANIES.UPDATE} hideChildren={true}>
            <EditOutlined
              style={{ fontSize: 17, color: '#fa8c16', cursor: 'pointer' }}
              onClick={() => { setEditRow(entity); setOpenUpdate(true) }}
            />
          </Access>
          <Access permission={All_PERMISSIONS.COMPANIES.DELETE} hideChildren={true}>
            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc chắn muốn xóa công ty này?"
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
  // Khớp với backend: CompanyFilterRequest
  //   searchTerm, industry, companySize, isVerified, sortBy, isDescending, pageNumber, pageSize
  const buildQuery = (params: any, sort: Partial<Record<string, SortOrder>>) => {
    const sp = new URLSearchParams()
    sp.set('pageNumber', String(params.current  ?? 1))
    sp.set('pageSize',   String(params.pageSize ?? 10))

    if (params.name)        sp.set('searchTerm',  params.name)
    if (params.industry)    sp.set('industry',    params.industry)
    if (params.isVerified !== undefined && params.isVerified !== null && params.isVerified !== '')
      sp.set('isVerified', String(params.isVerified))

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
    <Access permission={All_PERMISSIONS.COMPANIES.GET_PAGINATE} hideChildren={false}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={ADMIN_BREADCRUMBS.companies.map(item => ({
          title: item.href ? <Link to={item.href}>{item.title}</Link> : item.title
        }))}
      />
      <ProTable<ICompany>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        cardBordered
        headerTitle="Danh sách Công ty"
        toolBarRender={() => [
          <Access key="create" permission={All_PERMISSIONS.COMPANIES.CREATE} hideChildren={true}>
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
            const res   = await getCompaniesApi(query)
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
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} công ty`,
        }}
        scroll={{ x: true }}
      />

      <CreateCompanyModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSuccess={() => { setOpenCreate(false); reload() }}
      />
      <UpdateCompanyModal
        open={openUpdate}
        onOpenChange={setOpenUpdate}
        data={editRow}
        onSuccess={() => { setOpenUpdate(false); setEditRow(null); reload() }}
      />
    </Access>
  )
}

export default CompanyTable
