import { useEffect, useRef, useState } from 'react'
import { ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components'
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Breadcrumb, Button, Popconfirm, Select, Space, Tag, Tooltip } from 'antd'
import type { SortOrder } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'

import Access from '../../auth/Access'
import { All_PERMISSIONS } from '../../../types/permissions-util'
import { ADMIN_BREADCRUMBS } from '../../../types/breadcum'

import CreateJobModal from './job.create'
import UpdateJobModal from './job.update'
import DetailJobDrawer from './job.detail'
import type { IJob, JobStatus, JobLevel, JobType } from '../../../types/job'
import {
  JOB_STATUS_LABEL, JOB_STATUS_COLOR,
  JOB_LEVEL_LABEL, JOB_TYPE_LABEL,
} from '../../../types/job'
import { getAdminJobsApi, deleteJobApi } from '../../../services/job-service'
import { getCompaniesApi } from '../../../services/company-service'
import type { ICompany } from '../../../types/company'

const JOB_CATEGORY_LABEL: Record<string, string> = {
  Engineering: 'Kỹ thuật & Công nghệ',
  Marketing: 'Tiếp thị & Truyền thông',
  Sales: 'Kinh doanh & Bán hàng',
  Other: 'Khác',
}

const JobTable = () => {
  const actionRef = useRef<ActionType | null>(null)
  const pageRef   = useRef({ current: 1, pageSize: 10 })
  const { notification } = App.useApp()

  const [openCreate, setOpenCreate] = useState(false)
  const [openUpdate, setOpenUpdate] = useState(false)
  const [openDetail, setOpenDetail] = useState(false)
  const [editRow,    setEditRow]    = useState<IJob | null>(null)

  // ── Danh sách công ty cho filter ──────────────────────────────────────────
  const [companies,        setCompanies]        = useState<ICompany[]>([])
  const [companySearching, setCompanySearching] = useState(false)

  useEffect(() => {
    const fetchCompanies = async () => {
      setCompanySearching(true)
      try {
        const res = await getCompaniesApi('pageNumber=1&pageSize=200')
        setCompanies(res.data?.result ?? [])
      } catch {
        /* ignore */
      } finally {
        setCompanySearching(false)
      }
    }
    fetchCompanies()
  }, [])

  const reload = () => actionRef.current?.reload()

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await deleteJobApi(id)
      notification.success({ message: 'Thành công', description: 'Xóa tin tuyển dụng thành công', duration: 2 })
      reload()
    } catch (err: any) {
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Xóa tin tuyển dụng thất bại',
        duration: 3,
      })
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: ProColumns<IJob>[] = [
    {
      title: 'STT',
      key: 'index',
      width: 56,
      hideInSearch: true,
      render: (_t, _r, i) => i + 1 + (pageRef.current.current - 1) * pageRef.current.pageSize,
    },
    {
      title: 'Tên vị trí',
      dataIndex: 'name',
      ellipsis: true,
      width: 220,
    },
    {
      title: 'Công ty',
      dataIndex: 'companyId',
      width: 200,
      ellipsis: true,
      renderFormItem: () => (
        <Select
          showSearch
          allowClear
          loading={companySearching}
          placeholder="Tìm theo công ty..."
          optionFilterProp="label"
          options={companies.map(c => ({ value: c.id, label: c.name }))}
        />
      ),
      render: (_, r) => r.companyName ?? '—',
    },
    {
      title: 'Ngành nghề',
      dataIndex: 'category',
      width: 160,
      fieldProps: { placeholder: 'Tìm ngành nghề...' },
      render: (_, r) => (
        <Tag color="cyan">
          {JOB_CATEGORY_LABEL[r.category ?? ''] ?? r.category ?? '—'}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 120,
      render: (_, r) => (
        <Tag color={JOB_STATUS_COLOR[r.status as JobStatus] ?? 'default'}>
          {JOB_STATUS_LABEL[r.status as JobStatus] ?? r.status}
        </Tag>
      ),
      valueType: 'select',
      valueEnum: Object.fromEntries(
        (Object.keys(JOB_STATUS_LABEL) as JobStatus[]).map(k => [k, { text: JOB_STATUS_LABEL[k] }])
      ),
      fieldProps: { placeholder: 'Chọn trạng thái', allowClear: true },
    },
    {
      title: 'Cấp độ',
      dataIndex: 'level',
      width: 100,
      hideInSearch: true,
      render: (_, r) => JOB_LEVEL_LABEL[r.level as JobLevel] ?? r.level,
    },
    {
      title: 'Hình thức',
      dataIndex: 'jobType',
      width: 130,
      hideInSearch: true,
      render: (_, r) => (
        <Tag color="blue">{JOB_TYPE_LABEL[r.jobType as JobType] ?? r.jobType}</Tag>
      ),
    },
    {
      title: 'Địa điểm',
      dataIndex: 'location',
      ellipsis: true,
      hideInSearch: true,
      width: 130,
      render: (_, r) => r.location ?? '—',
    },
    {
      title: 'Lương (Min)',
      dataIndex: 'salaryMin',
      hideInSearch: true,
      width: 120,
      align: 'right',
      render: (_, r) => r.isSalaryNegotiable
        ? <Tag color="green">Thoả thuận</Tag>
        : r.salaryMin != null
          ? `${r.salaryMin.toLocaleString()} ${r.salaryCurrency}`
          : '—',
    },
    {
      title: 'Kỹ năng',
      dataIndex: 'skills',
      hideInSearch: true,
      width: 160,
      render: (_, r) => (
        <Space size={4} wrap>
          {r.skills.slice(0, 3).map(s => (
            <Tag key={s.id} style={{ margin: 0, fontSize: 11 }}>{s.name}</Tag>
          ))}
          {r.skills.length > 3 && <Tag style={{ margin: 0, fontSize: 11 }}>+{r.skills.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Lượt xem',
      dataIndex: 'viewCount',
      hideInSearch: true,
      width: 90,
      align: 'right',
      sorter: true,
    },
    {
      title: 'Hạn nộp',
      dataIndex: 'endDate',
      hideInSearch: true,
      width: 110,
      render: (_, r) => r.endDate ? dayjs(r.endDate).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdDate',
      hideInSearch: true,
      width: 110,
      sorter: true,
      render: (_d, r) => dayjs(r.createdDate).format('DD/MM/YYYY'),
    },
    {
      title: 'Thao tác',
      hideInSearch: true,
      width: 120,
      align: 'center',
      render: (_v, entity) => (
        <Space size={10}>
          <Access permission={All_PERMISSIONS.JOBS.UPDATE} hideChildren={true}>
            <Tooltip title="Chỉnh sửa">
              <EditOutlined
                style={{ fontSize: 17, color: '#fa8c16', cursor: 'pointer' }}
                onClick={() => { setEditRow(entity); setOpenUpdate(true) }}
              />
            </Tooltip>
          </Access>
          <Tooltip title="Xem chi tiết">
            <EyeOutlined
              style={{ fontSize: 17, color: '#1677ff', cursor: 'pointer' }}
              onClick={() => { setEditRow(entity); setOpenDetail(true) }}
            />
          </Tooltip>
          <Access permission={All_PERMISSIONS.JOBS.DELETE} hideChildren={true}>
            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc muốn xóa tin tuyển dụng này? Hành động không thể hoàn tác."
              onConfirm={() => handleDelete(entity.id)}
              okText="Xóa" cancelText="Hủy" placement="leftTop"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Xóa tin">
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

    if (params.name)      sp.set('searchTerm', params.name)
    if (params.status)    sp.set('status',     params.status)
    if (params.category)  sp.set('category',   params.category)
    if (params.companyId) sp.set('companyId',  params.companyId)

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
    <Access permission={All_PERMISSIONS.JOBS.GET_PAGINATE} hideChildren={false}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={ADMIN_BREADCRUMBS.jobs.map(item => ({
          title: item.href ? <Link to={item.href}>{item.title}</Link> : item.title
        }))}
      />
      <ProTable<IJob>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        cardBordered
        headerTitle="Danh sách Tin tuyển dụng"
        toolBarRender={() => [
          <Access key="create" permission={All_PERMISSIONS.JOBS.CREATE} hideChildren={true}>
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
            const res   = await getAdminJobsApi(query)
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
          pageSizeOptions: ['10', '20', '50'],
          defaultPageSize: 10,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} tin`,
        }}
        scroll={{ x: 1450 }}
      />

      {/* Modal tạo mới */}
      <CreateJobModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSuccess={() => { setOpenCreate(false); reload() }}
      />

      {/* Modal chỉnh sửa */}
      <UpdateJobModal
        open={openUpdate}
        onOpenChange={setOpenUpdate}
        data={editRow}
        onSuccess={() => { setOpenUpdate(false); setEditRow(null); reload() }}
      />

      {/* Drawer xem chi tiết */}
      <DetailJobDrawer
        open={openDetail}
        onClose={() => { setOpenDetail(false); setEditRow(null) }}
        data={editRow}
      />
    </Access>
  )
}

export default JobTable
