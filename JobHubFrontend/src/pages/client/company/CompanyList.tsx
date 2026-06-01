import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Select, Pagination, Spin, Empty } from 'antd'
import { getVerifiedCompaniesApi } from '../../../services/company-service'
import type { ICompany } from '../../../types/company'
import CompanyHero from '../../../components/shared/company/CompanyHero'
import CompanyFeatured from '../../../components/shared/company/CompanyFeatured'
import CompanyFilters from '../../../components/shared/company/CompanyFilters'
import CompanyCard from '../../../components/shared/company/CompanyCard'
import './CompanyList.scss'

const PAGE_SIZE = 4
const FEATURED_COUNT = 10

const CompanyList = () => {
  const navigate = useNavigate()
  const initFetched = useRef(false)

  // ── Slideshow state ───────────────────────────────────────────────────────
  const [slideIdx,   setSlideIdx]   = useState(0)
  const slideIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Search ────────────────────────────────────────────────────────────────
  const [keyword,        setKeyword]        = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')

  // ── Sidebar filters (client-side on current page) ─────────────────────────
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedSize,       setSelectedSize]       = useState<string>('')
  const [locationSearch,     setLocationSearch]     = useState('')

  // ── Sort & page ───────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState('createdDate')
  const [page,   setPage]   = useState(1)

  // ── Data ──────────────────────────────────────────────────────────────────
  const [companies,       setCompanies]       = useState<ICompany[]>([])
  const [total,           setTotal]           = useState(0)
  const [loading,         setLoading]         = useState(false)
  const [loadingFeatured, setLoadingFeatured] = useState(false)
  const [featuredList,    setFeaturedList]    = useState<ICompany[]>([])

  // ── Fetch (server-side pagination) ────────────────────────────────────────
  const fetchPage = async (pg: number, kw: string, sort: string) => {
    setLoading(true)
    try {
      const p = new URLSearchParams({
        pageNumber:   String(pg),
        pageSize:     String(PAGE_SIZE),
        sortBy:       sort,
        isDescending: sort === 'name' ? 'false' : 'true',
      })
      if (kw.trim()) p.append('searchTerm', kw.trim())

      const res = await getVerifiedCompaniesApi(p.toString())
      const result = res.data?.result ?? []
      setCompanies(result)
      setTotal(res.data?.meta?.total ?? 0)
    } catch {
      setCompanies([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  // Run ONCE on mount
  useEffect(() => {
    if (initFetched.current) return
    initFetched.current = true

    // Gọi API lấy danh sách công ty trang đầu tiên
    setLoading(true)
    const pageParams = new URLSearchParams({
      pageNumber:   '1',
      pageSize:     String(PAGE_SIZE),
      sortBy:       'createdDate',
      isDescending: 'true',
    })
    getVerifiedCompaniesApi(pageParams.toString())
      .then(res => {
        setCompanies(res.data?.result ?? [])
        setTotal(res.data?.meta?.total ?? 0)
      })
      .catch(() => {
        setCompanies([])
        setTotal(0)
      })
      .finally(() => setLoading(false))

    // Gọi API lấy danh sách công ty nổi bật song song
    setLoadingFeatured(true)
    const featuredParams = new URLSearchParams({
      pageNumber:   '1',
      pageSize:     String(FEATURED_COUNT),
      sortBy:       'name',
      isDescending: 'false',
    })
    getVerifiedCompaniesApi(featuredParams.toString())
      .then(res => {
        setFeaturedList(res.data?.result ?? [])
      })
      .catch(err => {
        console.error('Failed to fetch featured companies:', err)
      })
      .finally(() => setLoadingFeatured(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Auto-slideshow (3s) ───────────────────────────────────────────────────
  useEffect(() => {
    if (featuredList.length <= 1) return
    slideIntervalRef.current = setInterval(() => {
      setSlideIdx(i => (i + 1) % featuredList.length)
    }, 3000)
    return () => { if (slideIntervalRef.current) clearInterval(slideIntervalRef.current) }
  }, [featuredList.length])

  const goSlide = (dir: 'prev' | 'next') => {
    if (slideIntervalRef.current) clearInterval(slideIntervalRef.current)
    setSlideIdx(i => {
      const n = featuredList.length
      return dir === 'next' ? (i + 1) % n : (i - 1 + n) % n
    })
    slideIntervalRef.current = setInterval(() => {
      setSlideIdx(i => (i + 1) % featuredList.length)
    }, 3000)
  }

  // ── Client-side filter on current page ───────────────────────────────────
  const filtered = companies.filter(c => {
    if (selectedIndustries.length > 0 && c.industry && !selectedIndustries.includes(c.industry)) return false
    if (locationSearch.trim() && c.address && !c.address.toLowerCase().includes(locationSearch.toLowerCase())) return false
    if (selectedSize && c.companySize !== selectedSize) return false
    return true
  })

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSearch = () => {
    setAppliedKeyword(keyword)
    setPage(1)
    fetchPage(1, keyword, sortBy)
  }

  const handlePageChange = (pg: number) => {
    setPage(pg)
    fetchPage(pg, appliedKeyword, sortBy)
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    setPage(1)
    fetchPage(1, appliedKeyword, sort)
  }

  const handleClearFilters = () => {
    setSelectedIndustries([])
    setSelectedSize('')
    setLocationSearch('')
    setKeyword('')
    setAppliedKeyword('')
    setPage(1)
    fetchPage(1, '', sortBy)
  }

  const navigateToCompany = (id: string) => {
    navigate(`/companies/${id}`)
  }

  return (
    <main className="company-list-page">
      {/* ── Hero */}
      <CompanyHero
        keyword={keyword}
        setKeyword={setKeyword}
        onSearch={handleSearch}
      />

      {/* ── Featured Slideshow */}
      <CompanyFeatured
        featuredList={featuredList}
        slideIdx={slideIdx}
        setSlideIdx={setSlideIdx}
        goSlide={goSlide}
        loading={loadingFeatured}
        onNavigate={navigateToCompany}
      />

      {/* ── Main: Sidebar + List */}
      <section className="main-content-layout">
        {/* Sidebar Filters */}
        <CompanyFilters
          selectedIndustries={selectedIndustries}
          setSelectedIndustries={setSelectedIndustries}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          locationSearch={locationSearch}
          setLocationSearch={setLocationSearch}
          onClearFilters={handleClearFilters}
        />

        {/* List Area */}
        <div className="company-list-area">
          <div className="list-header">
            <p className="results-count">
              <span className="font-bold">{total}</span> công ty được tìm thấy
            </p>
            <div className="sort-container">
              <span className="sort-label">Sắp xếp:</span>
              <Select
                className="select-sort"
                variant="borderless"
                value={sortBy}
                onChange={handleSortChange}
                options={[
                  { value: 'createdDate', label: 'Mới nhất' },
                  { value: 'name',        label: 'Theo tên (A–Z)' },
                ]}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
          ) : filtered.length === 0 ? (
            <Empty description="Không tìm thấy công ty nào phù hợp." style={{ padding: 60 }} />
          ) : (
            <div className="company-cards-wrapper">
              {filtered.map(c => (
                <CompanyCard
                  key={c.id}
                  company={c}
                  onNavigate={navigateToCompany}
                />
              ))}
            </div>
          )}

          {total > PAGE_SIZE && (
            <div className="pagination-container">
              <span className="pagination-info">
                Hiển thị từ <strong>{Math.min((page - 1) * PAGE_SIZE + 1, total)}</strong> đến <strong>{Math.min(page * PAGE_SIZE, total)}</strong> trong tổng số <strong>{total}</strong> công ty
              </span>
              <Pagination
                current={page}
                pageSize={PAGE_SIZE}
                total={total}
                onChange={handlePageChange}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default CompanyList
