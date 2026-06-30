import React from 'react';

interface CalendarSyncCardProps {
  isGoogleSynced: boolean;
  isOutlookSynced: boolean;
  onToggleGoogle: () => void;
  onToggleOutlook: () => void;
  onSyncExisting?: () => void;
  googleEmail?: string;
}

export const CalendarSyncCard: React.FC<CalendarSyncCardProps> = ({
  isGoogleSynced,
  isOutlookSynced,
  onToggleGoogle,
  onToggleOutlook,
  onSyncExisting,
  googleEmail
}) => {
  return (
    <section className="section-card">
      <div className="sync-header">
        <h3>Calendar Sync</h3>
        {(isGoogleSynced || isOutlookSynced) ? (
          <span className="status-capsule status-live">
            <span className="material-symbols-outlined text-[14px]">check_circle</span> Live
          </span>
        ) : (
          <span className="status-capsule status-off">
            <span className="material-symbols-outlined text-[14px]">cancel</span> Off
          </span>
        )}
      </div>
      <p className="sync-desc">
        Connected to Outlook & Google Calendar for org-wide visibility.
      </p>
      <div className="sync-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'stretch', width: '100%', gap: '8px' }}>
          <div 
            onClick={onToggleGoogle}
            className={`sync-box ${isGoogleSynced ? '' : 'inactive'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1, cursor: 'pointer' }}
          >
            <img 
              alt="Google" 
              src="https://img.icons8.com/color/48/google-logo.png" 
            />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span className="text-label-md select-none font-semibold" style={{ lineHeight: 1.2 }}>Google</span>
              {isGoogleSynced && googleEmail && (
                <span style={{ fontSize: '10px', color: '#8c8c8c', fontWeight: 'normal' }}>{googleEmail}</span>
              )}
            </div>
          </div>
          {isGoogleSynced && onSyncExisting && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSyncExisting();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                width: '40px',
                cursor: 'pointer',
                background: '#fff'
              }}
              title="Đồng bộ lại toàn bộ lịch cũ"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#595959' }}>sync</span>
            </button>
          )}
        </div>
        <div 
          onClick={onToggleOutlook}
          className={`sync-box ${isOutlookSynced ? '' : 'inactive'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <img 
            alt="Outlook" 
            src="https://img.icons8.com/color/48/microsoft-outlook-2019.png" 
          />
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span className="text-label-md select-none font-semibold" style={{ lineHeight: 1.2 }}>Outlook</span>
          </div>
        </div>
      </div>
    </section>
  );
};
