import { useState } from 'react'
import { Modal, Upload, Button, Table, Alert, Space, Typography } from 'antd'
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons'
import type { RcFile } from 'antd/es/upload'

const { Dragger } = Upload
const { Text } = Typography

interface ValidationError {
  rowIndex: number
  columnName?: string
  errorMessage: string
}

interface ImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onImport: (file: File) => Promise<any>
  templateUrl?: string
  templateName?: string
  onSuccess?: () => void
}

const ImportModal = ({
  open,
  onOpenChange,
  title,
  onImport,
  templateUrl,
  templateName = 'template.xlsx',
  onSuccess,
}: ImportModalProps) => {
  const [fileList, setFileList] = useState<RcFile[]>([])
  const [importing, setImporting] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [generalError, setGeneralError] = useState<string | null>(null)

  const handleImport = async () => {
    if (fileList.length === 0) return
    setImporting(true)
    setErrors([])
    setGeneralError(null)

    try {
      await onImport(fileList[0])
      setFileList([])
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error(err)
      const errData = err?.response?.data
      if (errData?.data?.errors && Array.isArray(errData.data.errors)) {
        setErrors(errData.data.errors)
      } else {
        setGeneralError(errData?.message || err?.message || 'Có lỗi xảy ra khi import file.')
      }
    } finally {
      setImporting(false)
    }
  }

  const columns = [
    {
      title: 'Dòng',
      dataIndex: 'rowIndex',
      key: 'rowIndex',
      width: 80,
      align: 'center' as const,
      sorter: (a: ValidationError, b: ValidationError) => a.rowIndex - b.rowIndex,
    },
    {
      title: 'Cột',
      dataIndex: 'columnName',
      key: 'columnName',
      width: 150,
      render: (text: string) => text ? <Text code>{text}</Text> : '—',
    },
    {
      title: 'Chi tiết lỗi',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      render: (text: string) => <Text type="danger">{text}</Text>,
    },
  ]

  return (
    <Modal
      title={title}
      open={open}
      onCancel={() => {
        if (!importing) {
          onOpenChange(false)
          setFileList([])
          setErrors([])
          setGeneralError(null)
        }
      }}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            onOpenChange(false)
            setFileList([])
            setErrors([])
            setGeneralError(null)
          }}
          disabled={importing}
        >
          Hủy
        </Button>,
        <Button
          key="import"
          type="primary"
          onClick={handleImport}
          loading={importing}
          disabled={fileList.length === 0}
        >
          Bắt đầu import
        </Button>,
      ]}
      width={700}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 10 }}>
        {templateUrl && (
          <Alert
            message={
              <span>
                Vui lòng sử dụng đúng cấu trúc file mẫu.{' '}
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  href={templateUrl}
                  download={templateName}
                  style={{ padding: 0, height: 'auto' }}
                >
                  Tải file mẫu tại đây
                </Button>
              </span>
            }
            type="info"
            showIcon
          />
        )}

        <Dragger
          accept=".xlsx,.csv,.xls"
          beforeUpload={(file) => {
            setFileList([file])
            return false // Chặn upload tự động của Ant Design
          }}
          onRemove={() => setFileList([])}
          fileList={fileList}
          maxCount={1}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Kéo thả file Excel hoặc CSV vào đây hoặc click để chọn file</p>
          <p className="ant-upload-hint">Chỉ hỗ trợ file định dạng .xlsx, .xls, .csv</p>
        </Dragger>

        {generalError && (
          <Alert message="Lỗi" description={generalError} type="error" showIcon />
        )}

        {errors.length > 0 && (
          <div>
            <Alert
              message="Lỗi định dạng dữ liệu"
              description={`Phát hiện ${errors.length} dòng dữ liệu không hợp lệ. Vui lòng kiểm tra lại.`}
              type="error"
              showIcon
              style={{ marginBottom: 12 }}
            />
            <Table
              dataSource={errors}
              columns={columns}
              rowKey={(record, index) => `${record.rowIndex}-${record.columnName}-${index}`}
              pagination={{ pageSize: 5 }}
              size="small"
              bordered
            />
          </div>
        )}
      </Space>
    </Modal>
  )
}

export default ImportModal
