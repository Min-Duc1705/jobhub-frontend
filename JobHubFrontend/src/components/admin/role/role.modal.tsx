import { App, Badge, Collapse, Form, Row, Col, Space, Switch, Tag } from 'antd'
import { ModalForm, ProFormText, ProFormTextArea, ProFormSwitch } from '@ant-design/pro-components'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import type { IPermission, PermissionGroup } from '../../../types/permission'
import type { IRole, RoleBody } from '../../../types/role'
import { createRoleApi, updateRoleApi } from '../../../services/role-service'


// HTTP method → color map
const METHOD_COLOR: Record<string, string> = {
  GET: 'blue', POST: 'green', PUT: 'orange', DELETE: 'red', PATCH: 'purple',
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** All permissions grouped by module — loaded from API */
  permissionGroups: PermissionGroup[]
  /** null = create mode, otherwise = edit mode */
  initialRole: IRole | null
  onSuccess: () => void
}

const RoleModal = ({ open, onOpenChange, permissionGroups, initialRole, onSuccess }: Props) => {
  const [form] = Form.useForm()
  const { notification } = App.useApp()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [active, setActive] = useState(true)

  // Map: module → list of all permission ids in that group
  const groupIdMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    permissionGroups.forEach(g => {
      map[g.module] = g.permissions
        .filter(p => !!p.id)
        .map(p => p.id as string)
    })
    return map
  }, [permissionGroups])

  // Populate form when opening
  useEffect(() => {
    if (!open) return
    form.setFieldsValue({
      name: initialRole?.name ?? '',
      description: initialRole?.description ?? '',
    })
    setActive(initialRole?.isActive ?? true)
    const preset = new Set<string>(
      (initialRole?.permissions ?? []).map(p => p.id ?? '').filter(Boolean)
    )
    setSelected(preset)
  }, [open, initialRole, form])

  // ── Toggle helpers ────────────────────────────────────────────────────────
  const toggleOne = (id: string, checked: boolean) =>
    setSelected(prev => { const s = new Set(prev); checked ? s.add(id) : s.delete(id); return s })

  const toggleGroup = (module: string, checked: boolean) =>
    setSelected(prev => {
      const s = new Set(prev)
        ; (groupIdMap[module] ?? []).forEach(id => checked ? s.add(id) : s.delete(id))
      return s
    })

  const isGroupAll = (module: string) => (groupIdMap[module] ?? []).every(id => selected.has(id))
  const isGroupSome = (module: string) => {
    const ids = groupIdMap[module] ?? []
    return ids.some(id => selected.has(id)) && !ids.every(id => selected.has(id))
  }

  // ── Select All helpers ────────────────────────────────────────────────────
  const allIds = useMemo(() => Object.values(groupIdMap).flat(), [groupIdMap])
  const isAllSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
  const isAllSome    = allIds.some(id => selected.has(id)) && !isAllSelected

  const toggleAll = (checked: boolean) =>
    setSelected(() => checked ? new Set(allIds) : new Set())

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (values: { name: string; description: string }) => {
    const payload: RoleBody = {
      name: values.name.trim(),
      description: values.description?.trim() ?? '',
      isActive: active,
      permissionIds: Array.from(selected),   // flat Guid[] — khớp với backend
    }
    try {
      if (initialRole?.id) await updateRoleApi(initialRole.id, payload)
      else await createRoleApi(payload)

      notification.success({
        message: 'Thành công',
        description: initialRole?.id ? 'Cập nhật role thành công' : 'Tạo role thành công',
        duration: 2,
      })
      onSuccess()
      return true
    } catch (err: any) {
      notification.error({
        message: 'Thất bại',
        description: err?.response?.data?.message || 'Không thể lưu role',
        duration: 3,
      })
      return false
    }
  }

  // ── Permission tile ───────────────────────────────────────────────────────
  const PermissionItem = ({ p }: { p: IPermission }) => {
    const isOn = selected.has(p.id ?? '')
    return (
      <div
        style={{
          border: `1px solid ${isOn ? '#91caff' : '#f0f0f0'}`,
          borderRadius: 8,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: isOn ? '#e6f4ff' : '#fafafa',
          transition: 'all .15s',
          cursor: 'pointer',
        }}
        onClick={() => toggleOne(p.id ?? '', !isOn)}
      >
        <Tag
          color={METHOD_COLOR[p.method] ?? 'default'}
          style={{ fontSize: 10, margin: 0, minWidth: 46, textAlign: 'center', fontWeight: 700, letterSpacing: 0.5 }}
        >
          {p.method}
        </Tag>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#262626', lineHeight: 1.4 }}>{p.name}</div>
          <div
            style={{ color: '#8c8c8c', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={p.apiPath}
          >
            {p.apiPath}
          </div>
        </div>
        <Switch
          size="small"
          checked={isOn}
          onChange={v => { toggleOne(p.id ?? '', v) }}
          onClick={(_checked, e) => e.stopPropagation()}
        />
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ModalForm<{ name: string; description: string }>
      title={initialRole?.id ? 'Cập nhật Role' : 'Tạo mới Role'}
      open={open}
      onOpenChange={v => { onOpenChange(v); if (!v) form.resetFields() }}
      form={form}
      modalProps={{ destroyOnHidden: true, okText: initialRole?.id ? 'Cập nhật' : 'Tạo mới', cancelText: 'Hủy', centered: true, width: 900 }}
      layout="vertical"
      grid
      rowProps={{ gutter: 16 }}
      onFinish={handleSubmit}
    >
      <ProFormText
        name="name"
        label="Tên Role"
        placeholder="VD: ADMIN, HR, USER"
        rules={[{ required: true, message: 'Vui lòng nhập tên role!' }]}
        colProps={{ xs: 24, md: 16 }}
      />
      <ProFormSwitch
        label="Trạng thái"
        name="_active"
        colProps={{ xs: 24, md: 8 }}
        fieldProps={{
          checked: active,
          onChange: setActive,
          checkedChildren: 'ACTIVE',
          unCheckedChildren: 'INACTIVE',
        }}
      />
      <ProFormTextArea
        name="description"
        label="Mô tả"
        placeholder="Mô tả vai trò này..."
        fieldProps={{ autoSize: { minRows: 2, maxRows: 4 } }}
        colProps={{ span: 24 }}
      />

      {/* ── Permission header ────────────────────────────────────────── */}
      <Col span={24}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'linear-gradient(90deg, #f0f5ff 0%, #f9f0ff 100%)',
          border: '1px solid #d6e4ff',
          borderRadius: '10px 10px 0 0',
          borderBottom: 'none',
        }}>
          {/* Left: title + count */}
          <Space size={10} align="center">
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1677ff' }}>
              Phân quyền
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: selected.size > 0 ? '#1677ff' : '#d9d9d9',
              color: '#fff', borderRadius: 20, padding: '1px 10px', fontSize: 12, fontWeight: 600,
              transition: 'background .2s',
            }}>
              {selected.size}
              <span style={{ opacity: 0.7, fontWeight: 400 }}>/ {allIds.length}</span>
            </span>
            <span style={{ color: '#8c8c8c', fontSize: 12 }}>quyền đã chọn</span>
          </Space>

          {/* Right: select all */}
          <Space size={8} align="center">
            <span style={{ fontSize: 13, color: '#595959', fontWeight: 500 }}>Chọn tất cả</span>
            <Switch
              checked={isAllSelected}
              onChange={toggleAll}
              checkedChildren="✓"
              unCheckedChildren="○"
            />
          </Space>
        </div>

        {/* ── Collapse panels ───────────────────────────────────────── */}
        <div style={{ minHeight: 320, overflowY: 'auto', maxHeight: 420, width: '100%' }}>
          <Collapse
            style={{ borderRadius: '0 0 10px 10px', overflow: 'hidden', width: '100%' }}
            defaultActiveKey={permissionGroups.map(g => g.module)}
          >
          {permissionGroups.map(group => {
            const groupTotal    = (groupIdMap[group.module] ?? []).length
            const groupSelected = (groupIdMap[group.module] ?? []).filter(id => selected.has(id)).length
            const isAll  = isGroupAll(group.module)
            const isSome = isGroupSome(group.module)
            const badgeColor = isAll ? '#52c41a' : isSome ? '#faad14' : '#d9d9d9'

            return (
              <Collapse.Panel
                key={group.module}
                header={
                  <Space size={10}>
                    <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}>
                      {group.module}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: '#fff',
                      background: badgeColor, borderRadius: 20,
                      padding: '1px 8px', transition: 'background .2s',
                    }}>
                      {groupSelected}/{groupTotal}
                    </span>
                  </Space>
                }
                extra={
                  <span onClick={(e: MouseEvent<HTMLSpanElement>) => e.stopPropagation()}>
                    <Switch
                      size="small"
                      checked={isAll}
                      onChange={v => toggleGroup(group.module, v)}
                    />
                  </span>
                }
              >
                <Row gutter={[8, 8]}>
                  {group.permissions.map(p => (
                    <Col xs={24} sm={12} key={p.id}>
                      <PermissionItem p={p} />
                    </Col>
                  ))}
                </Row>
              </Collapse.Panel>
            )
          })}
          </Collapse>
        </div>
      </Col>
    </ModalForm>
  )
}

export default RoleModal
