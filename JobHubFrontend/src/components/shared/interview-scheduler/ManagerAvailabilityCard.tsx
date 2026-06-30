import React from 'react';

export const ManagerAvailabilityCard: React.FC = () => {
  return (
    <section className="section-card manager-section">
      <h3>Manager Availability</h3>
      <div className="manager-list">
        <div className="manager-item">
          <div className="manager-name">
            <div className="dot" style={{ backgroundColor: '#22c55e' }}></div>
            <span>David Miller</span>
          </div>
          <span className="manager-status">4 slots today</span>
        </div>
        <div className="manager-item">
          <div className="manager-name">
            <div className="dot" style={{ backgroundColor: '#eab308' }}></div>
            <span>Elena Rodriguez</span>
          </div>
          <span className="manager-status">Busy until 3 PM</span>
        </div>
        <div className="manager-item">
          <div className="manager-name">
            <div className="dot" style={{ backgroundColor: '#ef4444' }}></div>
            <span>Jason Statham</span>
          </div>
          <span className="manager-status">Out of Office</span>
        </div>
      </div>
    </section>
  );
};
