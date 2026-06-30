import React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';

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

interface CalendarGridProps {
  currentDate: Dayjs;
  events: InterviewEvent[];
  customEvents: InterviewEvent[];
  onCellAddClick: (date: Dayjs) => void;
  onEventClick: (event: InterviewEvent) => void;
  onEventCancel: (eventId: string, candidateName: string) => void;
  viewMode: 'month' | 'week' | 'day';
}

const getTypeColors = (type: 'Technical' | 'Cultural' | 'Final') => {
  switch (type) {
    case 'Technical':
      return { dot: '#002660' };
    case 'Cultural':
      return { dot: '#5400ad' };
    case 'Final':
      return { dot: '#b0c6ff' };
  }
};

// Helper to parse date string as local time ignoring timezone offset/Z shift
const parseRawDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return dayjs();
  return dayjs(dateStr);
};

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  events,
  customEvents,
  onCellAddClick,
  onEventClick,
  onEventCancel,
  viewMode
}) => {
  let startOfGrid: Dayjs;
  let totalDays: number;

  if (viewMode === 'day') {
    startOfGrid = currentDate.startOf('day');
    totalDays = 1;
  } else if (viewMode === 'week') {
    startOfGrid = currentDate.startOf('week');
    totalDays = 7;
  } else {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    startOfGrid = startOfMonth.startOf('week');
    const diffDays = endOfMonth.diff(startOfGrid, 'day');
    totalDays = diffDays <= 28 ? 28 : (diffDays <= 35 ? 35 : 42);
  }

  const cleanTime = (timeStr: string) => {
    return timeStr
      .replace('上午', 'AM')
      .replace('下午', 'PM')
      .split(' - ')[0];
  };
  
  const cells = [];
  for (let i = 0; i < totalDays; i++) {
    const cellDate = startOfGrid.add(i, 'day');
    const isCurrentMonth = viewMode !== 'month' || cellDate.month() === currentDate.month();
    const isToday = cellDate.isSame(dayjs(), 'day');
    
    const dayEvents = [
      ...events.filter(e => parseRawDate(e.interviewDate).isSame(cellDate, 'day')),
      ...customEvents.filter(e => parseRawDate(e.interviewDate).isSame(cellDate, 'day'))
    ];

    cells.push(
      <div 
        key={cellDate.format('YYYY-MM-DD')} 
        className={`calendar-cell ${!isCurrentMonth ? 'empty-cell' : ''} ${isToday ? 'today-cell' : ''}`}
      >
        <div className="cell-header">
          <span className={`day-number ${isToday ? 'today-label' : ''}`} style={{ fontSize: viewMode === 'day' ? '16px' : 'inherit' }}>
            {viewMode === 'day' ? cellDate.locale('vi').format('dddd, [Ngày] DD [tháng] MM') : cellDate.date()}
            {isToday && <span className="today-text"> (Hôm nay)</span>}
          </span>
          <button 
            onClick={() => onCellAddClick(cellDate)}
            className="add-cell-btn material-symbols-outlined"
            title="Thêm lịch"
          >
            add
          </button>
        </div>

        <div className="cell-events">
          {dayEvents.map(event => {
            const eventTypeColors = getTypeColors(event.type);
            const isPendingConfirm = event.status === 'PendingCandidateConfirm';

            return (
              <div 
                key={event.id}
                onClick={() => onEventClick(event)}
                className={`interview-item ${event.type === 'Technical' ? 'type-technical' : event.type === 'Cultural' ? 'type-cultural' : 'type-final'}`}
                style={{ 
                  borderStyle: isPendingConfirm ? 'dashed' : 'solid',
                  opacity: isPendingConfirm ? 0.8 : 1
                }}
              >
                <div className="event-title-row">
                  <div className="title-left">
                    <span className="color-dot" style={{ backgroundColor: eventTypeColors.dot }}></span>
                    <span className="truncate">
                      {event.candidateName.split(' ')[0]} • {event.type}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEventCancel(event.id, event.candidateName); }}
                    className="close-event-btn material-symbols-outlined"
                  >
                    close
                  </button>
                </div>
                <span className="event-time" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  {cleanTime(event.time)}
                  {isPendingConfirm && <span className="pending-confirm-badge">Chờ XN</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`calendar-wrapper calendar-view-${viewMode}`}>
      <div className="calendar-grid-header" style={{
        gridTemplateColumns: viewMode === 'day' ? '1fr' : 'repeat(7, 1fr)'
      }}>
        {viewMode === 'day' ? (
          <div className="grid-header-cell" style={{ textTransform: 'capitalize' }}>{currentDate.locale('vi').format('dddd')}</div>
        ) : (
          <>
            <div className="grid-header-cell">Sun</div>
            <div className="grid-header-cell">Mon</div>
            <div className="grid-header-cell">Tue</div>
            <div className="grid-header-cell">Wed</div>
            <div className="grid-header-cell">Thu</div>
            <div className="grid-header-cell">Fri</div>
            <div className="grid-header-cell">Sat</div>
          </>
        )}
      </div>

      <div className="calendar-grid-body" style={{
        gridTemplateColumns: viewMode === 'day' ? '1fr' : 'repeat(7, 1fr)'
      }}>
        {cells}
      </div>
    </div>
  );
};
