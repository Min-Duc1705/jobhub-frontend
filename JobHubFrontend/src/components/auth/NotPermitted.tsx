// NotPermitted — trang 403: không có quyền truy cập

import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

const NotPermitted = () => {
  const navigate = useNavigate()
  return (
    <Result
      status="403"
      title="403 — Truy cập bị từ chối"
      subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          Về trang chủ
        </Button>
      }
    />
  )
}

export default NotPermitted
