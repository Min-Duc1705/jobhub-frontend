import React from 'react';
import { Checkbox, Radio, Input, Button } from 'antd';

const ALL_INDUSTRIES = ['Công nghệ thông tin', 'Fintech', 'AI & Big Data', 'E-commerce', 'Cloud & DevOps'];

interface CompanyFiltersProps {
  selectedIndustries: string[];
  setSelectedIndustries: React.Dispatch<React.SetStateAction<string[]>>;
  selectedSize: string;
  setSelectedSize: (size: string) => void;
  locationSearch: string;
  setLocationSearch: (loc: string) => void;
  onClearFilters: () => void;
}

export default function CompanyFilters({
  selectedIndustries,
  setSelectedIndustries,
  selectedSize,
  setSelectedSize,
  locationSearch,
  setLocationSearch,
  onClearFilters
}: CompanyFiltersProps) {
  return (
    <aside className="sidebar-filters">
      <div className="filters-card">
        <div className="filters-header">
          <h3 className="filters-title">Bộ lọc</h3>
          <button className="btn-clear-all" onClick={onClearFilters}>Xóa tất cả</button>
        </div>

        <div className="filter-category">
          <p className="category-title">Ngành nghề</p>
          <div className="checkbox-group">
            {ALL_INDUSTRIES.map(ind => (
              <Checkbox
                key={ind}
                checked={selectedIndustries.includes(ind)}
                onChange={e => {
                  setSelectedIndustries(prev =>
                    e.target.checked ? [...prev, ind] : prev.filter(i => i !== ind));
                }}
              >
                {ind}
              </Checkbox>
            ))}
          </div>
        </div>

        <div className="filter-category border-top">
          <p className="category-title">Quy mô công ty</p>
          <Radio.Group
            className="radio-group"
            value={selectedSize}
            onChange={e => setSelectedSize(e.target.value)}
          >
            <Radio value="">Tất cả</Radio>
            <Radio value="STARTUP">Startup (&lt; 50 người)</Radio>
            <Radio value="SME">Vừa và nhỏ (50–500)</Radio>
            <Radio value="ENTERPRISE">Tập đoàn lớn (500+)</Radio>
          </Radio.Group>
        </div>

        <div className="filter-category border-top">
          <p className="category-title">Địa điểm</p>
          <div className="location-input-wrapper">
            <span className="material-symbols-outlined location-icon">location_on</span>
            <Input
              className="location-input"
              placeholder="Thành phố..."
              value={locationSearch}
              onChange={e => setLocationSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="ai-predictor-banner glass-ai">
        <div className="banner-content">
          <span className="banner-tag">Mới: Công cụ AI</span>
          <h4 className="banner-title">Dự đoán Lương</h4>
          <p className="banner-desc">Sử dụng AI để so sánh mức lương của bạn với thị trường IT hiện nay.</p>
          <Button className="btn-try-now" type="primary">Thử ngay</Button>
        </div>
        <div className="banner-bg-icon">
          <span className="material-symbols-outlined icon-insights">insights</span>
        </div>
      </div>
    </aside>
  );
}
