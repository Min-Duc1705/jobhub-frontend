import { useRef, useState } from 'react'
import { ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components'
import { EyeOutlined } from '@ant-design/icons'
import { App, Breadcrumb, Spin, Tag, Tooltip } from 'antd'
import type { SortOrder } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'

import Access from '../../auth/Access'
import { All_PERMISSIONS } from '../../../types/permissions-util'
import { ADMIN_BREADCRUMBS } from '../../../types/breadcum'

import type { IResume } from '../../../types/resume-builder'
import { getMyResumesApi } from '../../../services/resume-service'
import axios from '../../../services/axios-customize'
import type { ApiResponse, PageResult } from '../../../types/common'

/** Admin: lấy tất cả CVs (không filter theo customerId) */
const getAllResumesAdminApi = (query: string): Promise<ApiResponse<PageResult<IResume>>> =>
  axios.get(`/api/v1/resumes?${query}`)

const ResumeAdminTable = () => {
  const actionRef = useRef<ActionType | null>(null)
  const pageRef   = useRef({ current: 1, pageSize: 10 })
  const { notification } = App.useApp()

  const [previewingId, setPreviewingId] = useState<string | null>(null)

  const handlePreview = async (record: IResume) => {
    if (!record?.id) return
    if (record.isOnlineCv) {
      window.open(`/candidate/resume/builder/${record.id}`, '_blank')
      return
    }

    setPreviewingId(record.id)
    try {
      const token   = localStorage.getItem('access_token')
      const baseUrl = import.meta.env.VITE_BACKEND_URL ?? ''
      const res = await fetch(`${baseUrl}/api/v1/resumes/${record.id}/preview`, {
        headers:     token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      window.open(URL.createObjectURL(blob), '_blank')
    } catch (err) {
      console.error(err)
      notification.error({
        message:     'Thất bại',
        description: 'Không thể tải bản xem trước CV. Vui lòng thử lại.',
        duration:    3,
      })
    } finally {
      setPreviewingId(null)
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: ProColumns<IResume>[] = [
    {
      title: 'STT',
      key: 'index',
      width: 56,
      hideInSearch: true,
      render: (_t, _r, i) => i + 1 + (pageRef.current.current - 1) * pageRef.current.pageSize,
    },
    {
      title: 'Tiêu đề CV',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: 'ID Ứng viên',
      dataIndex: 'customerId',
      ellipsis: true,
      copyable: true,
      width: 150,
    },
    {
      title: 'Loại',
      dataIndex: 'isOnlineCv',
      width: 130,
      hideInSearch: true,
      render: (_, r) => {
        const isLoading = previewingId === r.id
        return (
          <Tooltip title={r.isOnlineCv ? 'Xem Online CV (tab mới)' : 'Xem Preview CV dạng PDF (tab mới)'}>
            <Tag
              color={r.isOnlineCv ? 'blue' : 'default'}
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={() => handlePreview(r)}
            >
              {isLoading ? <Spin size="small" style={{ marginRight: 4 }} /> : <EyeOutlined />}
              {r.isOnlineCv ? 'Online CV' : 'File CV'}
            </Tag>
          </Tooltip>
        )
      },
    },
    {
      title: 'Mặc định',
      dataIndex: 'isDefault',
      width: 90,
      hideInSearch: true,
      render: (_, r) => r.isDefault
        ? <Tag color="gold">Mặc định</Tag>
        : <Tag>Không</Tag>,
    },
    {
      title: 'Template',
      dataIndex: 'templateId',
      width: 90,
      hideInSearch: true,
      render: (v) => v ? `#${v}` : '—',
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
  ]

  // ── Build query ───────────────────────────────────────────────────────────
  const buildQuery = (params: any, sort: Partial<Record<string, SortOrder>>) => {
    const sp = new URLSearchParams()
    sp.set('pageNumber', String(params.current ?? 1))
    sp.set('pageSize',   String(params.pageSize ?? 10))

    if (params.title) sp.set('searchTerm', params.title)

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
    <Access permission={All_PERMISSIONS.RESUMES.GET_PAGINATE} hideChildren={false}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={ADMIN_BREADCRUMBS.resumes.map(item => ({
          title: item.href ? <Link to={item.href}>{item.title}</Link> : item.title
        }))}
      />
      <ProTable<IResume>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        cardBordered
        headerTitle="Danh sách CV (Toàn hệ thống)"
        toolBarRender={() => []}
        search={{ labelWidth: 'auto', span: { xs: 24, sm: 24, md: 12, lg: 8, xl: 6, xxl: 6 } }}
        request={async (params, sort) => {
          pageRef.current = { current: params.current ?? 1, pageSize: params.pageSize ?? 10 }
          try {
            const query = buildQuery(params, sort)
            const res = await getAllResumesAdminApi(query)
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
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} CV`,
        }}
        scroll={{ x: true }}
      />
    </Access>
  )
}

export default ResumeAdminTable
