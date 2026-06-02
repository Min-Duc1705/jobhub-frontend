import { useRef, useState } from 'react'
import { ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components'
import { EyeOutlined } from '@ant-design/icons'
import { Breadcrumb, Button, Card, Descriptions, Modal, Space, Tag } from 'antd'
import type { SortOrder } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'

import Access from '../../auth/Access'
import { All_PERMISSIONS } from '../../../types/permissions-util'
import { ADMIN_BREADCRUMBS } from '../../../types/breadcum'
import { getContactsApi, type IContact } from '../../../services/contact-service'

const ContactTable = () => {
  const actionRef = useRef<ActionType | null>(null)
  const pageRef = useRef({ current: 1, pageSize: 10 })

  const [openDetail, setOpenDetail] = useState(false)
  const [activeRow, setActiveRow] = useState<IContact | null>(null)

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns: ProColumns<IContact>[] = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      hideInSearch: true,
      render: (_t, _r, i) => i + 1 + (pageRef.current.current - 1) * pageRef.current.pageSize,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      ellipsis: true,
      sorter: false,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      ellipsis: true,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      width: 120,
      render: (_, r) => r.phone || '—',
    },
    {
      title: 'Chủ đề',
      dataIndex: 'topic',
      width: 160,
      valueType: 'select',
      valueEnum: {
        'Hỗ trợ tìm việc': { text: 'Hỗ trợ tìm việc' },
        'Hợp tác doanh nghiệp': { text: 'Hợp tác doanh nghiệp' },
        'Góp ý dịch vụ': { text: 'Góp ý dịch vụ' },
        'Yêu cầu khác': { text: 'Yêu cầu khác' },
      },
      render: (_, r) => {
        let color = 'default'
        if (r.topic === 'Hợp tác doanh nghiệp') color = 'blue'
        if (r.topic === 'Hỗ trợ tìm việc') color = 'green'
        if (r.topic === 'Góp ý dịch vụ') color = 'orange'
        return <Tag color={color}>{r.topic}</Tag>
      },
    },
    {
      title: 'Nội dung lời nhắn',
      dataIndex: 'message',
      hideInSearch: true,
      ellipsis: true,
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'createdAt',
      hideInSearch: true,
      width: 150,
      render: (_, r) => r.createdAt ? dayjs(r.createdAt).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: 'Xem',
      hideInSearch: true,
      width: 70,
      align: 'center',
      render: (_, entity) => (
        <Space size={10}>
          <Button
            type="text"
            icon={<EyeOutlined style={{ fontSize: 16, color: '#1890ff' }} />}
            onClick={() => {
              setActiveRow(entity)
              setOpenDetail(true)
            }}
          />
        </Space>
      ),
    },
  ]

  // ── Build query ─────────────────────────────────────────────────────────────
  const buildQuery = (params: any) => {
    const sp = new URLSearchParams()
    sp.set('pageNumber', String(params.current ?? 1))
    sp.set('pageSize', String(params.pageSize ?? 10))

    if (params.fullName) sp.set('searchTerm', params.fullName)
    if (params.email) sp.set('searchTerm', params.email)
    if (params.topic) sp.set('topic', params.topic)

    return sp.toString()
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Access permission={All_PERMISSIONS.CONTACTS.GET_PAGINATE} hideChildren={false}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={ADMIN_BREADCRUMBS.contacts.map(item => ({
          title: item.href ? <Link to={item.href}>{item.title}</Link> : item.title
        }))}
      />
      <ProTable<IContact>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        cardBordered
        headerTitle="Danh sách liên hệ & hỗ trợ"
        search={{ labelWidth: 'auto', span: 6 }}
        request={async (params) => {
          pageRef.current = { current: params.current ?? 1, pageSize: params.pageSize ?? 10 }
          try {
            const query = buildQuery(params)
            const res = await getContactsApi(query)
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
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} liên hệ`,
        }}
        scroll={{ x: true }}
      />

      <Modal
        title="Chi tiết thông tin liên hệ"
        open={openDetail}
        onCancel={() => {
          setOpenDetail(false)
          setActiveRow(null)
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setOpenDetail(false)
              setActiveRow(null)
            }}
          >
            Đóng
          </Button>,
        ]}
        width={700}
      >
        {activeRow && (
          <div style={{ marginTop: 16 }}>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Họ và tên">{activeRow.fullName}</Descriptions.Item>
              <Descriptions.Item label="Email">{activeRow.email}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{activeRow.phone || '—'}</Descriptions.Item>
              <Descriptions.Item label="Chủ đề">
                <Tag color={
                  activeRow.topic === 'Hợp tác doanh nghiệp' ? 'blue' :
                  activeRow.topic === 'Hỗ trợ tìm việc' ? 'green' :
                  activeRow.topic === 'Góp ý dịch vụ' ? 'orange' : 'default'
                }>
                  {activeRow.topic}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian gửi">
                {dayjs(activeRow.createdAt).format('DD/MM/YYYY HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
            <Card title="Nội dung lời nhắn" style={{ marginTop: 16, background: '#f5f5f5' }}>
              <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                {activeRow.message}
              </p>
            </Card>
          </div>
        )}
      </Modal>
    </Access>
  )
}

export default ContactTable
