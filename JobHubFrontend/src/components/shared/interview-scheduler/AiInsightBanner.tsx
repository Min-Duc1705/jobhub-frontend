import React from 'react';

interface AiInsightBannerProps {
  onResolve: () => void;
}

export const AiInsightBanner: React.FC<AiInsightBannerProps> = ({ onResolve }) => {
  return (
    <div className="glass-ai">
      <div className="ai-icon">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          auto_awesome
        </span>
      </div>
      <div className="ai-text">
        <h4>AI Smart-Schedule Insight</h4>
        <p>
          Hệ thống AI tự động hóa lịch phỏng vấn và gợi ý những khung giờ phù hợp dựa trên múi giờ của ứng viên và lịch trống của Manager.
        </p>
      </div>
      <button 
        onClick={onResolve}
        className="resolve-btn"
      >
        Tối ưu ngay
      </button>
    </div>
  );
};
