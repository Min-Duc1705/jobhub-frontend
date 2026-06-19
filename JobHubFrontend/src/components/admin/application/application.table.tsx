import { useRef, useState } from 'react'
import { ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components'
import { EditOutlined, EyeOutlined } from '@ant-design/icons'
import { App, Breadcrumb, Space, Tag, Tooltip, Spin } from 'antd'
import type { SortOrder } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'

import Access from '../../auth/Access'
import { All_PERMISSIONS } from '../../../types/permissions-util'
import { ADMIN_BREADCRUMBS } from '../../../types/breadcum'

import UpdateApplicationModal from './application.update'
import type { IApplication, ApplicationStatus } from '../../../types/application'
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_COLOR } from '../../../types/application'
import { getApplicationsApi } from '../../../services/application-service'

const ApplicationTable = () => {
  const actionRef = useRef<ActionType | null>(null)
  const pageRef   = useRef({ current: 1, pageSize: 10 })
  const { notification } = App.useApp()

  const [openUpdate, setOpenUpdate] = useState(false)
  const [editRow,    setEditRow]    = useState<IApplication | null>(null)
  const [previewingId, setPreviewingId] = useState<string | null>(null)

  const handlePreview = async (resume: any) => {
    if (!resume?.id) return
    if (resume.isOnlineCv) {
      window.open(`/candidate/resume/builder/${resume.id}`, '_blank')
      return
    }

    setPreviewingId(resume.id)
    try {
      const token = localStorage.getItem('access_token')
      const baseUrl = import.meta.env.VITE_BACKEND_URL ?? ''
      const res = await fetch(`${baseUrl}/api/v1/resumes/${resume.id}/preview`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err) {
      console.error(err)
      notification.error({
        message: 'Thất bại',
        description: 'Không thể tải bản xem trước CV. Vui lòng thử lại.',
        duration: 3,
      })
    } finally {
      setPreviewingId(null)
    }
  }

  const reload = () => actionRef.current?.reload()

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: ProColumns<IApplication>[] = [
    {
      title: 'STT',
      key: 'index',
      width: 56,
      hideInSearch: true,
      render: (_t, _r, i) => i + 1 + (pageRef.current.current - 1) * pageRef.current.pageSize,
    },
    {
      title: 'ID Đơn',
      dataIndex: 'id',
      width: 120,
      ellipsis: true,
      copyable: true,
      hideInSearch: true,
    },
    {
      title: 'ID Ứng viên',
      dataIndex: 'customerId',
      ellipsis: true,
      copyable: true,
      width: 140,
    },
    {
      title: 'ID Tin tuyển dụng',
      dataIndex: 'jobId',
      ellipsis: true,
      copyable: true,
      width: 160,
      hideInSearch: true,
    },
    {
      title: 'CV đính kèm',
      dataIndex: ['resume', 'title'],
      ellipsis: true,
      hideInSearch: true,
      render: (_v, r) => {
        if (!r.resume?.title) return '—'
        const isOnline = r.resume.isOnlineCv
        const isLoading = previewingId === r.resume.id

        return (
          <Tooltip title={isOnline ? "Xem Online CV (tab mới)" : "Xem Preview CV dạng PDF (tab mới)"}>
            <Tag
              color={isOnline ? 'blue' : 'default'}
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={() => handlePreview(r.resume)}
            >
              {isLoading ? <Spin size="small" style={{ marginRight: 4 }} /> : <EyeOutlined />}
              {r.resume.title}
            </Tag>
          </Tooltip>
        )
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 130,
      render: (_, r) => (
        <Tag color={APPLICATION_STATUS_COLOR[r.status as ApplicationStatus]}>
          {APPLICATION_STATUS_LABEL[r.status as ApplicationStatus] ?? r.status}
        </Tag>
      ),
      valueType: 'select',
      valueEnum: Object.fromEntries(
        (Object.keys(APPLICATION_STATUS_LABEL) as ApplicationStatus[]).map(k => [
          k,
          { text: APPLICATION_STATUS_LABEL[k] },
        ])
      ),
      fieldProps: { placeholder: 'Chọn trạng thái', allowClear: true },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'reviewNote',
      ellipsis: true,
      hideInSearch: true,
      render: (v) => v || '—',
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'createdDate',
      hideInSearch: true,
      width: 120,
      sorter: true,
      render: (_d, r) => dayjs(r.createdDate).format('DD/MM/YYYY'),
    },
    {
      title: 'Thao tác',
      hideInSearch: true,
      fixed: 'right',
      width: 120,
      align: 'center',
      render: (_v, entity) => (
        <Space size={12}>
          <Access permission={All_PERMISSIONS.APPLICATIONS.STATUS} hideChildren={true}>
            <EditOutlined
              style={{ fontSize: 17, color: '#fa8c16', cursor: 'pointer' }}
              onClick={() => { setEditRow(entity); setOpenUpdate(true) }}
            />
          </Access>
        </Space>
      ),
    },
  ]

  // ── Build query ───────────────────────────────────────────────────────────
  const buildQuery = (params: any, sort: Partial<Record<string, SortOrder>>) => {
    const sp = new URLSearchParams()
    sp.set('pageNumber', String(params.current ?? 1))
    sp.set('pageSize',   String(params.pageSize ?? 10))

    if (params.customerId) sp.set('customerId', params.customerId)
    if (params.jobId)      sp.set('jobId', params.jobId)
    if (params.status)     sp.set('status', params.status)

    const sortEntry = sort ? Object.entries(sort).find(([, o]) => !!o) : null
    if (sortEntry) {
      sp.set('sortBy', sortEntry[0])
      sp.set('isDescending', sortEntry[1] === 'descend' ? 'true' : 'false')
    } else {
      sp.set('sortBy', 'createdDate')
      sp.set('isDescending', 'true')
    }
    return sp.toString()
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Access permission={All_PERMISSIONS.APPLICATIONS.GET_PAGINATE} hideChildren={false}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={ADMIN_BREADCRUMBS.applications.map(item => ({
          title: item.href ? <Link to={item.href}>{item.title}</Link> : item.title
        }))}
      />
      <ProTable<IApplication>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        cardBordered
        headerTitle="Danh sách Đơn ứng tuyển"
        toolBarRender={() => []}
        search={{ labelWidth: 'auto', span: { xs: 24, sm: 24, md: 12, lg: 8, xl: 6, xxl: 6 } }}
        request={async (params, sort) => {
          pageRef.current = { current: params.current ?? 1, pageSize: params.pageSize ?? 10 }
          try {
            const query = buildQuery(params, sort)
            const res = await getApplicationsApi(query)
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
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} đơn`,
        }}
        scroll={{ x: 'max-content' }}
      />

      <UpdateApplicationModal
        open={openUpdate}
        data={editRow}
        onOpenChange={setOpenUpdate}
        onSuccess={() => { setOpenUpdate(false); setEditRow(null); reload() }}
      />
    </Access>
  )
}

export default ApplicationTable
