import React from 'react';
import { Button } from 'antd';

interface RegisterSuccessProps {
  onBack: () => void;
}

export default function RegisterSuccess({ onBack }: RegisterSuccessProps) {
  return (
    <div className="cr-wrap">
      <div className="cr-body">
        <div className="cr-success">
          <div className="cr-success__icon">
            <span className="material-symbols-outlined">verified</span>
          </div>
          <h2>Đăng ký thành công!</h2>
          <p>
            Công ty của bạn đã được ghi nhận và đang chờ Admin xác minh.
            Sau khi được duyệt, hồ sơ công ty sẽ hiển thị công khai trên JobHub.
          </p>
          <Button type="primary" size="large" onClick={onBack}>
            Quay về hồ sơ cá nhân
          </Button>
        </div>
      </div>
    </div>
  );
}
