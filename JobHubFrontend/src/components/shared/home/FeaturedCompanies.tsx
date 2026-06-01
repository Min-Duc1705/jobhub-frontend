import { Link } from 'react-router-dom'
import type { ICompany } from '../../../types/company'

interface FeaturedCompaniesProps {
  companies: ICompany[]
  loading: boolean
}

const FeaturedCompanies = ({ companies, loading }: FeaturedCompaniesProps) => {
  if (loading) {
    return (
      <section className="home-companies">
        <h2 className="home-companies__title">Top Công Ty Nổi Bật</h2>
        <div className="home-companies__grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="home-companies__card" style={{ opacity: 0.5, background: '#f8fafc' }}>
              <span>Đang tải...</span>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (companies.length === 0) return null

  return (
    <section className="home-companies">
      <h2 className="home-companies__title">Top Công Ty Nổi Bật</h2>
      <div className="home-companies__grid">
        {companies.map(c => (
          <Link key={c.id} to={`/companies/${c.id}`} className="home-companies__card">
            {c.logo ? (
              <img src={c.logo} alt={c.name} />
            ) : (
              <span style={{ fontWeight: 600, color: '#334155', textAlign: 'center' }}>{c.name}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}

export default FeaturedCompanies
