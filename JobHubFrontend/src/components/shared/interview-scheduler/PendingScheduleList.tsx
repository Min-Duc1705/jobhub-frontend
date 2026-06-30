import React from 'react';
import { Avatar } from 'antd';
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

interface PendingScheduleListProps {
  candidates: PendingCandidate[];
  onSelectCandidate: (candidate: PendingCandidate) => void;
  onRefresh: () => void;
}

const getAvatarColor = (name: string) => {
  const colors = ['#002660', '#5400ad', '#005b60', '#b02a2a', '#d97706'];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
};

export const PendingScheduleList: React.FC<PendingScheduleListProps> = ({
  candidates,
  onSelectCandidate,
  onRefresh
}) => {
  return (
    <section className="section-card">
      <div className="pending-header">
        <h3>Pending Schedule</h3>
        <span className="badge">
          {candidates.length}
        </span>
      </div>
      
      <div className="pending-list">
        {candidates.length === 0 ? (
          <div className="text-center py-6 text-on-surface-variant text-body-sm" style={{ padding: '24px 0', textAlign: 'center', color: '#747783' }}>
            Không có ứng viên nào chờ đặt lịch.
          </div>
        ) : (
          candidates.map(c => {
            const tagClass = c.type === 'Technical' ? 'tag-technical' : c.type === 'Cultural' ? 'tag-cultural' : 'tag-final';
            return (
              <div 
                key={c.id} 
                onClick={() => onSelectCandidate(c)}
                className="pending-item"
              >
                <Avatar 
                  shape="square" 
                  size={48} 
                  src={c.image}
                  icon={<UserOutlined />}
                  style={{ 
                    backgroundColor: getAvatarColor(c.name), 
                    minWidth: 48, 
                    borderRadius: 8, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: 18, 
                    fontWeight: 600,
                    color: '#ffffff'
                  }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </Avatar>
                <div className="pending-info">
                  <h4>{c.name}</h4>
                  <p>{c.role}</p>
                  <div className="flex gap-2">
                    <span className={`type-tag ${tagClass}`}>
                      {c.type}
                    </span>
                  </div>
                </div>
                <button className="add-btn material-symbols-outlined">
                  calendar_add_on
                </button>
              </div>
            );
          })
        )}
      </div>
      
      <button className="view-all-btn" onClick={onRefresh}>
        Tải lại ứng viên chờ
      </button>
    </section>
  );
};
