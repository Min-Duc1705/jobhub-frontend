import { Input, Select, Button } from 'antd'

interface Props {
  keyword: string
  location: string
  onChangeKeyword: (val: string) => void
  onChangeLocation: (val: string) => void
  onSearch: () => void
}

const HomeHero = ({ keyword, location, onChangeKeyword, onChangeLocation, onSearch }: Props) => {
  return (
    <section className="home-hero-section">
      <div className="hero-overlay-decor">
        <div className="decor-circle circle-1"></div>
        <div className="decor-circle circle-2"></div>
      </div>
      <div className="hero-bg-pattern">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWpaTFrYKcoOO2S7yrFakzXYPkGGixRrzcYCuJVPX_fVs22ay9cZ_q1-Gk5ecu2ZWeXm5w1I6WKA4QbGMqR1glYqkyYZjUgvSFF5w0YULOv8DHeLhdN1PJAdpYuD1VgkSilisXzDxXxFesBIVpwTHhbkCGHRwnpxY6Hy8s2HgAwn2xOYsRFxRfkSEgERm3pAVNr856BLvnH4HpCg6ucSPqNPSey9y8Aswh3-9YhiOAkbzJfyljdZNjWOoyaPGzbf-XC0hnuExN9-4"
          alt="Pattern background"
          className="hero-bg-img"
        />
      </div>
      <div className="hero-content">
        <h1 className="hero-title">Tìm kiếm công việc IT mơ ước</h1>
        <p className="hero-subtitle">
          Khám phá hàng ngàn cơ hội việc làm từ các công ty công nghệ hàng đầu, được hỗ trợ bởi AI.
        </p>

        <div className="search-bar-container glass-ai">
          <div className="search-input-wrapper">
            <span className="material-symbols-outlined search-icon">search</span>
            <Input
              className="search-input"
              placeholder="Nhập từ khóa kỹ năng, chức danh..."
              variant="borderless"
              value={keyword}
              onChange={(e) => onChangeKeyword(e.target.value)}
              onPressEnter={onSearch}
            />
          </div>

          <div className="search-select-wrapper">
            <span className="material-symbols-outlined select-icon">location_on</span>
            <Select
              className="search-select"
              variant="borderless"
              value={location}
              onChange={onChangeLocation}
              options={[
                { value: '', label: 'Tất cả địa điểm' },
                { value: 'hanoi', label: 'Hà Nội' },
                { value: 'hcm', label: 'TP. Hồ Chí Minh' },
                { value: 'danang', label: 'Đà Nẵng' },
              ]}
            />
          </div>

          <Button className="btn-search-home" type="primary" onClick={onSearch}>
            Tìm kiếm
          </Button>
        </div>
      </div>
    </section>
  )
}

export default HomeHero
