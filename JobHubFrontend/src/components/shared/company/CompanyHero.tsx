import React from 'react';
import { Input, Button } from 'antd';

interface CompanyHeroProps {
  keyword: string;
  setKeyword: (keyword: string) => void;
  onSearch: () => void;
}

export default function CompanyHero({ keyword, setKeyword, onSearch }: CompanyHeroProps) {
  return (
    <section className="company-hero-section">
      <div className="hero-overlay-decor">
        <div className="decor-circle circle-1" />
        <div className="decor-circle circle-2" />
      </div>
      <div className="hero-content">
        <h1 className="hero-title">Khám phá các Công ty Công nghệ Hàng đầu</h1>
        <p className="hero-subtitle">Tìm kiếm môi trường làm việc lý tưởng từ hàng ngàn doanh nghiệp IT uy tín.</p>
        <div className="search-bar-container glass-ai">
          <div className="search-input-wrapper">
            <span className="material-symbols-outlined search-icon">search</span>
            <Input
              className="search-input"
              placeholder="Tên công ty, từ khóa..."
              variant="borderless"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={onSearch}
            />
          </div>
          <Button className="btn-search-company" type="primary" onClick={onSearch}>
            Tìm kiếm
          </Button>
        </div>
      </div>
    </section>
  );
}
