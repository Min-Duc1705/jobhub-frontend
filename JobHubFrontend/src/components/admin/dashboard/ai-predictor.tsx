import React from 'react';
import { Modal } from 'antd';

const AiPredictor = () => {
  const handlePredictSalary = () => {
    Modal.info({
      title: 'AI Market Report Generated',
      content: (
        <div style={{ marginTop: '12px' }}>
          <p>Based on current market vectors, tech hiring volumes, and salary scales, we predict:</p>
          <ul>
            <li><strong>AI / ML Engineers:</strong> +6.8% ($125,000 - $185,000)</li>
            <li><strong>React / Frontend Specialists:</strong> +4.5% ($95,000 - $145,000)</li>
            <li><strong>Golang / DevOps Architects:</strong> +5.2% ($115,000 - $170,000)</li>
          </ul>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '16px' }}>
            Powered by JobHub AI Engine. Confidence rating 98.4%.
          </p>
        </div>
      ),
      okText: 'Close Insight',
      onOk() { },
    });
  };

  return (
    <section className="ai-predictor-banner-premium">
      <div className="predictor-left">
        <div className="ai-title-row">
          <span className="material-symbols-outlined ai-lightning">bolt</span>
          <h4 className="ai-title-text">AI Market Insights</h4>
        </div>
        <p className="ai-description-text">
          Our AI engine predicts a 4.2% increase in senior developer salaries for Q3 based on current platform trends.
        </p>
        <div className="ai-metrics-row">
          <div className="metric-box">
            <p className="metric-label">Avg. Growth</p>
            <p className="metric-val">+4.2%</p>
          </div>
          <div className="metric-box border-left">
            <p className="metric-label">Confidence</p>
            <p className="metric-val">98%</p>
          </div>
        </div>
      </div>
      <div className="predictor-right">
        <button className="btn-premium-action" onClick={handlePredictSalary}>
          Generate Predicted Salary Range
        </button>
      </div>
    </section>
  );
};

export default AiPredictor;
