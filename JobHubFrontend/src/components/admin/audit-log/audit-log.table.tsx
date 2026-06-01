import { useRef, useState } from 'react'
import { ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components'
import { Avatar, Button, Modal, Space, Tag, Tooltip, Typography } from 'antd'
import type { SortOrder } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import { getAuditLogsApi } from '../../../services/notification-service'
import type { IAuditLogDto } from '../../../services/notification-service'
import { getCustomerByIdApi } from '../../../services/customer-service'

const AuditLogTable = () => {
  const actionRef = useRef<ActionType | null>(null)
  const pageRef = useRef({ current: 1, pageSize: 10 })

  const [selectedAudit, setSelectedAudit] = useState<IAuditLogDto | null>(null)
  const [isDetailVisible, setIsDetailVisible] = useState(false)

  const [avatars, setAvatars] = useState<Record<string, string>>({})
  const fetchedUserIds = useRef<Set<string>>(new Set())

  const fetchAvatarsForLogs = async (logs: IAuditLogDto[]) => {
    const uniqueUserIds = Array.from(new Set(logs.map(log => log.userId).filter((id): id is string => !!id)))
    const idsToFetch = uniqueUserIds.filter(id => !fetchedUserIds.current.has(id))

    if (idsToFetch.length === 0) return

    idsToFetch.forEach(id => fetchedUserIds.current.add(id))

    const newAvatars: Record<string, string> = {}
    await Promise.all(
      idsToFetch.map(async (userId) => {
        try {
          const res = await getCustomerByIdApi(userId)
          if (res.data?.avatar) {
            newAvatars[userId] = res.data.avatar
          } else {
            newAvatars[userId] = ''
          }
        } catch (err) {
          console.error(`Không thể lấy avatar cho user ${userId}:`, err)
          newAvatars[userId] = ''
        }
      })
    )

    setAvatars(prev => ({ ...prev, ...newAvatars }))
  }

  const handleOpenDetail = (log: IAuditLogDto) => {
    setSelectedAudit(log)
    setIsDetailVisible(true)
  }

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: ProColumns<IAuditLogDto>[] = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      hideInSearch: true,
      render: (_t, _r, i) => i + 1 + (pageRef.current.current - 1) * pageRef.current.pageSize,
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'username',
      ellipsis: true,
      render: (_, r) => {
        const displayName = r.username || r.email || 'System'
        const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=002660&color=fff&size=128&rounded=true`
        const realAvatar = r.userId ? avatars[r.userId] : null

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar src={realAvatar || defaultAvatarUrl} style={{ flexShrink: 0 }} size="large" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600 }}>{r.username || 'System'}</span>
              <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{r.email || 'N/A'}</span>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Địa chỉ IP',
      dataIndex: 'ipAddress',
      width: 130,
      hideInSearch: true,
      render: (_, r) => <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{r.ipAddress || 'Internal'}</span>,
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      width: 120,
      valueType: 'select',
      valueEnum: {
        CREATE: { text: 'CREATE' },
        UPDATE: { text: 'UPDATE' },
        DELETE: { text: 'DELETE' },
      },
      fieldProps: { placeholder: 'Chọn hành động', allowClear: true },
      render: (_, r) => {
        let color = 'default'
        if (r.action === 'DELETE') color = 'red'
        else if (r.action === 'UPDATE') color = 'blue'
        else if (r.action === 'CREATE') color = 'green'
        return <Tag color={color} style={{ fontWeight: 600 }}>{r.action}</Tag>
      },
    },
    {
      title: 'Đối tượng',
      dataIndex: 'entityName',
      width: 140,
      valueType: 'select',
      valueEnum: {
        Job: { text: 'Job' },
        Resume: { text: 'Resume' },
        Application: { text: 'Application' },
        Skill: { text: 'Skill' },
        JobSkill: { text: 'JobSkill' },
        SavedJob: { text: 'SavedJob' },
      },
      fieldProps: { placeholder: 'Chọn đối tượng', allowClear: true },
      render: (_, r) => <strong style={{ color: '#002660' }}>{r.entityName}</strong>,
    },
    {
      title: 'Target ID',
      dataIndex: 'entityId',
      width: 150,
      render: (_, r) => {
        const val = r.entityId
        if (!val) return '—'
        return (
          <Tooltip title={val}>
            <Typography.Text
              copyable={{ text: val }}
              style={{ fontSize: '12px', fontFamily: 'monospace', background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}
            >
              {val.length > 8 ? `${val.substring(0, 8)}...` : val}
            </Typography.Text>
          </Tooltip>
        )
      },
    },
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      width: 160,
      hideInSearch: true,
      sorter: true,
      render: (_, r) => dayjs(r.timestamp).format('HH:mm:ss DD/MM/YYYY'),
    },
    {
      title: 'Thao tác',
      hideInSearch: true,
      width: 80,
      align: 'center',
      render: (_, r) => (
        <Tooltip title="Xem chi tiết JSON">
          <Button
            type="text"
            shape="circle"
            icon={<span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#002660', verticalAlign: 'middle' }}>visibility</span>}
            onClick={() => handleOpenDetail(r)}
          />
        </Tooltip>
      ),
    },
  ]

  // ── Build query ───────────────────────────────────────────────────────────
  const buildQuery = (params: any, sort: Partial<Record<string, SortOrder>>) => {
    const sp = new URLSearchParams()
    sp.set('page', String(params.current ?? 1))
    sp.set('pageSize', String(params.pageSize ?? 10))

    if (params.action) {
      sp.set('action', params.action)
    }
    if (params.entityName) {
      sp.set('entityName', params.entityName)
    }

    const textSearch = params.username || params.entityId
    if (textSearch) {
      sp.set('searchTerm', textSearch)
    }

    return sp.toString()
  }

  return (
    <>
      <ProTable<IAuditLogDto>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        cardBordered
        headerTitle="Lịch sử hoạt động hệ thống"
        toolBarRender={() => []}
        search={{ labelWidth: 'auto', span: 6 }}
        request={async (params, sort) => {
          pageRef.current = { current: params.current ?? 1, pageSize: params.pageSize ?? 10 }
          try {
            const query = buildQuery(params, sort)
            const res = await getAuditLogsApi(query)
            const logs = res.data?.result ?? []
            fetchAvatarsForLogs(logs)
            return {
              data: logs,
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
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} hoạt động`,
        }}
        scroll={{ x: true }}
      />

      {/* Modal - Activity Detail */}
      <Modal
        title="Chi tiết sự kiện hệ thống"
        open={isDetailVisible}
        onCancel={() => setIsDetailVisible(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setIsDetailVisible(false)}>
            Đóng
          </Button>
        ]}
        width={650}
        className="audit-detail-modal"
      >
        {selectedAudit && (
          <div className="activity-detail-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="detail-profile-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar 
                src={(selectedAudit.userId && avatars[selectedAudit.userId]) || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAudit.username || selectedAudit.email || 'System')}&background=002660&color=fff&size=128&rounded=true`} 
                size={48} 
              />
              <div>
                <h4 style={{ margin: 0, fontSize: '16px' }}>{selectedAudit.username || 'Hành động hệ thống'}</h4>
                <p style={{ margin: 0, color: '#8c8c8c' }}>{selectedAudit.email || 'N/A'}</p>
              </div>
            </div>

            <div className="detail-meta-list" style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', rowGap: '8px' }}>
                <div><strong>Thao tác:</strong></div>
                <div>
                  <Tag color={selectedAudit.action === 'DELETE' ? 'red' : selectedAudit.action === 'UPDATE' ? 'blue' : 'green'} style={{ fontWeight: 600 }}>
                    {selectedAudit.action}
                  </Tag>
                </div>

                <div><strong>Người thực hiện:</strong></div>
                <div>{selectedAudit.username || 'System'} ({selectedAudit.email || 'N/A'})</div>

                <div><strong>Đối tượng tác động:</strong></div>
                <div><code>{selectedAudit.entityName}</code></div>

                <div><strong>Mã đối tượng (Id):</strong></div>
                <div><code>{selectedAudit.entityId}</code></div>

                <div><strong>Địa chỉ IP:</strong></div>
                <div>{selectedAudit.ipAddress || 'Internal/System'}</div>

                <div><strong>Thời gian:</strong></div>
                <div>{dayjs(selectedAudit.timestamp).format('HH:mm:ss DD/MM/YYYY')}</div>

                <div><strong>User Agent:</strong></div>
                <div style={{ fontSize: '12px', color: '#595959', wordBreak: 'break-all' }}>{selectedAudit.userAgent || 'N/A'}</div>
              </div>
            </div>

            {selectedAudit.changesJson && (
              <div className="changes-json-container">
                <h5 style={{ marginBottom: '8px' }}>Chi tiết thay đổi dữ liệu (Diff):</h5>
                <div style={{ maxHeight: '250px', overflowY: 'auto', backgroundColor: '#001529', color: '#a6e22e', padding: '12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '13px' }}>
                  {(() => {
                    try {
                      const parsed = JSON.parse(selectedAudit.changesJson)
                      return (
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {JSON.stringify(parsed, null, 2)}
                        </pre>
                      )
                    } catch (e) {
                      return <pre style={{ margin: 0 }}>{selectedAudit.changesJson}</pre>
                    }
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}

export default AuditLogTable
