/**
 * useProvinces — Hook tỉnh/thành phố Việt Nam với module-level cache
 *
 * Dữ liệu tỉnh/phường chỉ được fetch 1 lần duy nhất trong toàn bộ session,
 * dùng chung cho RegisterPage, ProfileSettings, UpdateCustomerModal, HomePage...
 * Không cần truyền prop, không cần context.
 */
import { useState, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
export interface WardItem {
  name: string
  mergedFrom?: string[]
}

export interface ProvinceItem {
  id: string
  province: string
  wards: WardItem[]
}

export interface ProvinceOption {
  value: string
  label: string
}

// ── Module-level cache (sống suốt session) ────────────────────────────────
let _cache: ProvinceItem[] | null = null
let _promise: Promise<ProvinceItem[]> | null = null

const PROVINCE_API = 'https://vietnamlabs.com/api/vietnamprovince'

async function fetchProvinces(): Promise<ProvinceItem[]> {
  if (_cache) return _cache

  // Dedup: nếu request đang bay thì chờ chung, không gọi thêm
  if (!_promise) {
    _promise = fetch(PROVINCE_API)
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          _cache = json.data as ProvinceItem[]
          return _cache
        }
        return [] as ProvinceItem[]
      })
      .catch(() => [] as ProvinceItem[])
  }

  return _promise
}

// ── Simple province options (chỉ tên tỉnh) ───────────────────────────────
export function useProvinces() {
  const [data, setData] = useState<ProvinceItem[]>(_cache ?? [])
  const [loading, setLoading] = useState(_cache === null)

  useEffect(() => {
    if (_cache) {
      setData(_cache)
      setLoading(false)
      return
    }
    fetchProvinces().then(result => {
      setData(result)
      setLoading(false)
    })
  }, [])

  const provinceOptions: ProvinceOption[] = data.map(p => ({
    value: p.province,
    label: p.province,
  }))

  const getWards = (provinceName: string): ProvinceOption[] => {
    const found = data.find(p => p.province === provinceName)
    if (!found) return []
    return found.wards.map(w => ({ value: w.name, label: w.name }))
  }

  return { data, provinceOptions, getWards, loading }
}

// ── Simple name-only list (cho HomePage hero search) ─────────────────────
export function useProvinceNames(withExtras = true) {
  const [options, setOptions] = useState<ProvinceOption[]>([])
  const [loading, setLoading] = useState(_cache === null)

  useEffect(() => {
    const build = (list: ProvinceItem[]) => {
      const cleanName = (name: string) =>
        name.replace(/^(Thành phố|Tỉnh)\s+/i, '').trim()

      const opts: ProvinceOption[] = list.map(p => ({
        value: cleanName(p.province),
        label: cleanName(p.province),
      }))

      if (withExtras) {
        opts.unshift({ label: 'Tất cả địa điểm', value: '' })
        opts.push({ label: 'Remote', value: 'Remote' })
        opts.push({ label: 'Khác', value: 'Khác' })
      }
      return opts
    }

    if (_cache) {
      setOptions(build(_cache))
      setLoading(false)
      return
    }

    fetchProvinces().then(result => {
      setOptions(build(result))
      setLoading(false)
    })
  }, [withExtras])

  return { options, loading }
}
