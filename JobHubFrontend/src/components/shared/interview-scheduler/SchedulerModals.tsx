import React from 'react';
import { Modal, Form, Input, Select, DatePicker, TimePicker, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

interface PendingCandidate {
  id: string;
  candidateId: string;
  campaignId: string;
  name: string;
  role: string;
  type: 'Technical' | 'Cultural' | 'Final';
  image?: string;
  status: string;
}

interface InterviewEvent {
  id: string;
  candidateId: string;
  campaignId: string;
  candidateName: string;
  role: string;
  type: 'Technical' | 'Cultural' | 'Final';
  interviewDate: string;
  time: string;
  image?: string;
  status: string;
}

interface SchedulerModalsProps {
  scheduleModalOpen: boolean;
  activeCandidate: PendingCandidate | null;
  onScheduleCancel: () => void;
  onScheduleFinish: (values: any) => void;
  scheduleForm: any;

  rescheduleModalOpen: boolean;
  activeEvent: InterviewEvent | null;
  onRescheduleCancel: () => void;
  onRescheduleFinish: (values: any) => void;
  rescheduleForm: any;

  addEventModalOpen: boolean;
  onAddEventCancel: () => void;
  onAddEventFinish: (values: any) => void;
  addEventForm: any;
  pendingCandidates: PendingCandidate[];
  isCustomCandidate: boolean;
  setIsCustomCandidate: (isCustom: boolean) => void;
}

const getAvatarColor = (name: string) => {
  const colors = ['#002660', '#5400ad', '#005b60', '#b02a2a', '#d97706'];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
};

export const SchedulerModals: React.FC<SchedulerModalsProps> = ({
  scheduleModalOpen,
  activeCandidate,
  onScheduleCancel,
  onScheduleFinish,
  scheduleForm,
  rescheduleModalOpen,
  activeEvent,
  onRescheduleCancel,
  onRescheduleFinish,
  rescheduleForm,
  addEventModalOpen,
  onAddEventCancel,
  onAddEventFinish,
  addEventForm,
  pendingCandidates,
  isCustomCandidate,
  setIsCustomCandidate
}) => {
  return (
    <>
      {/* MODAL 1: Schedule Candidate */}
      <Modal
        title="Xếp lịch phỏng vấn"
        open={scheduleModalOpen}
        onCancel={onScheduleCancel}
        okText="Xác nhận đặt lịch"
        onOk={() => scheduleForm.submit()}
      >
        <div className="py-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#f4f3f3', borderRadius: 8, marginBottom: 24 }}>
            <Avatar 
              shape="square" 
              size={48} 
              src={activeCandidate?.image}
              icon={<UserOutlined />}
              style={{ 
                backgroundColor: getAvatarColor(activeCandidate?.name || ''), 
                borderRadius: 8, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: 18, 
                fontWeight: 600,
                color: '#ffffff'
              }}
            >
              {activeCandidate?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{activeCandidate?.name}</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, textTransform: 'uppercase', color: '#434651', fontWeight: 500, letterSpacing: '0.05em' }}>{activeCandidate?.role}</p>
            </div>
          </div>
          
          <Form form={scheduleForm} layout="vertical" onFinish={onScheduleFinish}>
            <Form.Item name="type" label="Loại phỏng vấn" rules={[{ required: true }]}>
              <Select options={[
                { label: 'Technical Interview', value: 'Technical' },
                { label: 'Cultural/Fit Interview', value: 'Cultural' },
                { label: 'Final Round Panel', value: 'Final' }
              ]} />
            </Form.Item>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="date" label="Ngày phỏng vấn" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
              
              <Form.Item name="timeRange" label="Khung giờ" rules={[{ required: true }]}>
                <TimePicker.RangePicker style={{ width: '100%' }} format="hh:mm A" use12Hours />
              </Form.Item>
            </div>
          </Form>
        </div>
      </Modal>

      {/* MODAL 2: Reschedule */}
      <Modal
        title="Thay đổi lịch phỏng vấn"
        open={rescheduleModalOpen}
        onCancel={onRescheduleCancel}
        okText="Cập nhật"
        onOk={() => rescheduleForm.submit()}
      >
        <div className="py-4">
          <p style={{ marginBottom: 16, color: '#434651' }}>
            Thay đổi khung giờ phỏng vấn cho ứng viên <strong>{activeEvent?.candidateName}</strong> ({activeEvent?.role}).
          </p>
          
          <Form form={rescheduleForm} layout="vertical" onFinish={onRescheduleFinish}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="date" label="Ngày mới" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
              
              <Form.Item name="timeRange" label="Khung giờ mới" rules={[{ required: true }]}>
                <TimePicker.RangePicker style={{ width: '100%' }} format="hh:mm A" use12Hours />
              </Form.Item>
            </div>
          </Form>
        </div>
      </Modal>

      {/* MODAL 3: Add Event (from cell) */}
      <Modal
        title="Thêm lịch phỏng vấn mới"
        open={addEventModalOpen}
        onCancel={onAddEventCancel}
        okText="Thêm lịch hẹn"
        onOk={() => addEventForm.submit()}
      >
        <div className="py-4">
          <Form 
            form={addEventForm} 
            layout="vertical" 
            onFinish={onAddEventFinish}
            onValuesChange={(changed) => {
              if (changed.candidateSelect !== undefined) {
                setIsCustomCandidate(changed.candidateSelect === 'custom');
              }
            }}
          >
            <Form.Item name="candidateSelect" label="Chọn ứng viên chờ từ AI Campaign" rules={[{ required: true }]}>
              <Select options={[
                { label: '➕ Nhập ứng viên tự do (lưu cục bộ)', value: 'custom' },
                ...pendingCandidates.map(c => ({ label: `${c.name} - ${c.role}`, value: c.id }))
              ]} />
            </Form.Item>

            {isCustomCandidate && (
              <>
                <Form.Item name="candidateName" label="Tên ứng viên tự do" rules={[{ required: true, message: 'Vui lòng nhập tên ứng viên' }]}>
                  <Input placeholder="Ví dụ: Nguyễn Văn A" />
                </Form.Item>
                <Form.Item name="role" label="Vị trí tuyển dụng" rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}>
                  <Input placeholder="Ví dụ: Senior Frontend Developer" />
                </Form.Item>
              </>
            )}

            <Form.Item name="type" label="Loại phỏng vấn" rules={[{ required: true }]}>
              <Select options={[
                { label: 'Technical Interview', value: 'Technical' },
                { label: 'Cultural/Fit Interview', value: 'Cultural' },
                { label: 'Final Round Panel', value: 'Final' }
              ]} />
            </Form.Item>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="date" label="Ngày phỏng vấn" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item name="timeRange" label="Khung giờ" rules={[{ required: true }]}>
                <TimePicker.RangePicker style={{ width: '100%' }} format="hh:mm A" use12Hours />
              </Form.Item>
            </div>
          </Form>
        </div>
      </Modal>
    </>
  );
};
