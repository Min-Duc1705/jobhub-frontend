import React from 'react';
import { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';

interface SchedulerHeaderProps {
  currentDate: Dayjs;
  viewMode: 'month' | 'week' | 'day';
  onViewModeChange: (mode: 'month' | 'week' | 'day') => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
}

export const SchedulerHeader: React.FC<SchedulerHeaderProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onNavigatePrev,
  onNavigateNext,
  onNavigateToday
}) => {
  return (
    <div className="main-header">
      <div>
        <h1>Interview Schedule</h1>
        <p style={{ textTransform: 'capitalize' }}>
          {currentDate.locale('vi').format('MMMM YYYY')} • Tuần {currentDate.week()}
        </p>
      </div>
      
      <div className="controls-bar">
        <div className="view-toggle">
          <button 
            onClick={() => onViewModeChange('month')}
            className={viewMode === 'month' ? 'active' : ''}
          >
            Month
          </button>
          <button 
            onClick={() => onViewModeChange('week')}
            className={viewMode === 'week' ? 'active' : ''}
          >
            Week
          </button>
          <button 
            onClick={() => onViewModeChange('day')}
            className={viewMode === 'day' ? 'active' : ''}
          >
            Day
          </button>
        </div>
        
        <div className="nav-buttons">
          <button className="material-symbols-outlined" onClick={onNavigatePrev}>
            chevron_left
          </button>
          <span className="today" style={{ cursor: 'pointer' }} onClick={onNavigateToday}>
            Today
          </span>
          <button className="material-symbols-outlined" onClick={onNavigateNext}>
            chevron_right
          </button>
        </div>
      </div>
    </div>
  );
};
