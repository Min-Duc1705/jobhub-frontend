import { Input, Button } from 'antd'

interface Props {
  keyword: string
  locationInput: string
  onChangeKeyword: (val: string) => void
  onChangeLocation: (val: string) => void
  onSearch: () => void
}

const JobHeroSearch = ({
  keyword,
  locationInput,
  onChangeKeyword,
  onChangeLocation,
  onSearch,
}: Props) => {
  return (
    <section className="hero-search-section">
      <div className="hero-bg-img">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWpaTFrYKcoOO2S7yrFakzXYPkGGixRrzcYCuJVPX_fVs22ay9cZ_q1-Gk5ecu2ZWeXm5w1I6WKA4QbGMqR1glYqkyYZjUgvSFF5w0YULOv8DHeLhdN1PJAdpYuD1VgkSilisXzDxXxFesBIVpwTHhbkCGHRwnpxY6Hy8s2HgAwn2xOYsRFxRfkSEgERm3pAVNr856BLvnH4HpCg6ucSPqNPSey9y8Aswh3-9YhiOAkbzJfyljdZNjWOoyaPGzbf-XC0hnuExN9-4"
          alt="Hero background"
        />
      </div>
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1 className="hero-title">Tìm Công Việc Phù Hợp</h1>
        <p className="hero-subtitle">
          Hàng nghìn cơ hội việc làm IT từ các công ty hàng đầu Việt Nam.
        </p>
        <div className="search-bar-container glass-panel ai-glow">
          <div className="search-input-wrapper">
            <span className="material-symbols-outlined search-icon">search</span>
            <Input
              className="search-input"
              placeholder="Chức danh, kỹ năng, công ty..."
              variant="borderless"
              value={keyword}
              onChange={e => onChangeKeyword(e.target.value)}
              onPressEnter={onSearch}
            />
          </div>
          <div className="search-input-wrapper">
            <span className="material-symbols-outlined search-icon">location_on</span>
            <Input
              className="search-input"
              placeholder="Thành phố, Remote..."
              variant="borderless"
              value={locationInput}
              onChange={e => onChangeLocation(e.target.value)}
              onPressEnter={onSearch}
            />
          </div>
          <Button className="btn-search-jobs" type="primary" onClick={onSearch}>
            Tìm kiếm
          </Button>
        </div>
      </div>
    </section>
  )
}

export default JobHeroSearch
