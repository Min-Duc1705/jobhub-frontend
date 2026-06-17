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

const normalizeLocation = (str: string): string => {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese accents
    .replace(/đ/g, 'd')
    .replace(/t\.?p\.?\s*/g, '')     // Remove TP.
    .replace(/h\s*c\s*m/g, 'ho chi minh') // Map hcm to ho chi minh
    .replace(/thanh\s*pho\s*/g, '')  // Remove Thanh pho
    .replace(/tinh\s*/g, '')         // Remove Tinh
    .trim()
}

const matchIndustryCategory = (companyIndustry: string, selectedCategories: string[]): boolean => {
  if (selectedCategories.length === 0) return true
  if (!companyIndustry) return false
  
  const ind = companyIndustry.toLowerCase()
  
  return selectedCategories.some(cat => {
    switch (cat) {
      case 'Công nghệ thông tin':
        return ind.includes('công nghệ thông tin') || 
               ind.includes('software') || 
               ind.includes('it services') || 
               ind.includes('it consulting') || 
               ind.includes('phát triển phần mềm') || 
               ind.includes('viễn thông') ||
               ind.includes('telecommunication') ||
               ind.includes('systems integration') || 
               ind.includes('it infrastructure') ||
               ind.includes('technology');
      case 'Fintech':
        return ind.includes('fintech') || 
               ind.includes('banking') || 
               ind.includes('tài chính') || 
               ind.includes('ngân hàng') || 
               ind.includes('digital finance') || 
               ind.includes('payments');
      case 'AI & Big Data':
        return ind.includes('ai') || 
               ind.includes('artificial intelligence') || 
               ind.includes('big data') || 
               ind.includes('data analytics') || 
               ind.includes('data science') || 
               ind.includes('machine learning') ||
               ind.includes('cognitive');
      case 'E-commerce':
        return ind.includes('e-commerce') || 
               ind.includes('thương mại điện tử') || 
               ind.includes('retail tech') || 
               ind.includes('logistics tech') || 
               ind.includes('e-commerce platform') ||
               ind.includes('e-commerce enabler');
      case 'Cloud & DevOps':
        return ind.includes('cloud') || 
               ind.includes('devops') || 
               ind.includes('infrastructure') ||
               ind.includes('network');
      default:
        return ind.includes(cat.toLowerCase());
    }
  })
}

const CompanyList = () => {
  const navigate = useNavigate()
  const initFetched = useRef(false)

  // ── Slideshow state ───────────────────────────────────────────────────────
  const [slideIdx,   setSlideIdx]   = useState(0)
  const slideIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Search ────────────────────────────────────────────────────────────────
  const [keyword,        setKeyword]        = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')

  // ── Sidebar filters ───────────────────────────────────────────────────────
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedSize,       setSelectedSize]       = useState<string>('')
  const [locationSearch,     setLocationSearch]     = useState('')

  // ── Sort & page ───────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState('createdDate')
  const [page,   setPage]   = useState(1)

  // ── Data ──────────────────────────────────────────────────────────────────
  const [allCompanies,    setAllCompanies]    = useState<ICompany[]>([])
  const [loading,         setLoading]         = useState(false)
  const [loadingFeatured, setLoadingFeatured] = useState(false)
  const [featuredList,    setFeaturedList]    = useState<ICompany[]>([])

  // Run ONCE on mount — fetch all verified companies & featured list
  useEffect(() => {
    if (initFetched.current) return
    initFetched.current = true

    setLoading(true)
    setLoadingFeatured(true)

    const featuredParams = new URLSearchParams({
      pageNumber:   '1',
      pageSize:     String(FEATURED_COUNT),
      sortBy:       'name',
      isDescending: 'false',
    })

    Promise.all([
      getVerifiedCompaniesApi('pageNumber=1&pageSize=1000')
        .then(res => {
          setAllCompanies(res.data?.result ?? [])
        })
        .catch(err => console.error('Failed to fetch verified companies:', err))
        .finally(() => setLoading(false)),

      getVerifiedCompaniesApi(featuredParams.toString())
        .then(res => setFeaturedList(res.data?.result ?? []))
        .catch(err => console.error('Failed to fetch featured companies:', err))
        .finally(() => setLoadingFeatured(false)),
    ])
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

  // ── Client-side filter on all verified companies ────────────────────────
  const filtered = allCompanies.filter(c => {
    // 1. Search term (search by name or industry)
    if (appliedKeyword.trim()) {
      const kw = appliedKeyword.toLowerCase()
      const nameMatch = c.name.toLowerCase().includes(kw)
      const indMatch = c.industry ? c.industry.toLowerCase().includes(kw) : false
      if (!nameMatch && !indMatch) return false
    }
    // 2. Industry filter (match any of the selected industries)
    if (selectedIndustries.length > 0) {
      if (!c.industry || !matchIndustryCategory(c.industry, selectedIndustries)) return false
    }
    // 3. Location filter (match if address contains locationSearch, normalized)
    if (locationSearch.trim()) {
      if (!c.address) return false
      const normalizedAddr = normalizeLocation(c.address)
      const normalizedSearch = normalizeLocation(locationSearch)
      if (!normalizedAddr.includes(normalizedSearch)) return false
    }
    // 4. Size filter
    if (selectedSize && c.companySize !== selectedSize) return false
    return true
  })

  // ── Client-side sort ─────────────────────────────────────────────────────
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    }
    // Default / createdDate (newer first)
    const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0
    const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0
    return dateB - dateA
  })

  // ── Client-side pagination ───────────────────────────────────────────────
  const total = sorted.length
  const paginatedCompanies = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSearch = () => {
    setAppliedKeyword(keyword)
    setPage(1)
  }

  const handlePageChange = (pg: number) => {
    setPage(pg)
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    setPage(1)
  }

  const handleClearFilters = () => {
    setSelectedIndustries([])
    setSelectedSize('')
    setLocationSearch('')
    setKeyword('')
    setAppliedKeyword('')
    setPage(1)
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
          ) : paginatedCompanies.length === 0 ? (
            <Empty description="Không tìm thấy công ty nào phù hợp." style={{ padding: 60 }} />
          ) : (
            <div className="company-cards-wrapper">
              {paginatedCompanies.map(c => (
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
