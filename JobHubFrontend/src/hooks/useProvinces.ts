/**
 * useProvinces — Hook tỉnh/thành phố Việt Nam với 2-tier cache
 *
 * Tier 1: Module-level RAM (_cache) — nhanh nhất, reset khi F5
 * Tier 2: localStorage với TTL 7 ngày — persist qua F5, đóng/mở tab
 *
 * Chỉ fetch API 1 lần duy nhất trong suốt 7 ngày.
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

// ── Cache config ─────────────────────────────────────────────────────────
const STORAGE_KEY = 'vn_provinces_v1'
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 ngày
const PROVINCE_API = 'https://vietnamlabs.com/api/vietnamprovince'

interface StoredCache {
  data: ProvinceItem[]
  expiresAt: number
}

// ── Tier 1: Module-level RAM cache ────────────────────────────────────────
let _cache: ProvinceItem[] | null = null
let _promise: Promise<ProvinceItem[]> | null = null
const _listeners = new Set<() => void>()

function _notifyListeners() {
  _listeners.forEach(fn => fn())
}

// ── Tier 2: localStorage helpers ──────────────────────────────────────────
function readLocalStorage(): ProvinceItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const stored: StoredCache = JSON.parse(raw)
    if (Date.now() > stored.expiresAt) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return stored.data
  } catch {
    return null
  }
}

function writeLocalStorage(data: ProvinceItem[]) {
  try {
    const payload: StoredCache = {
      data,
      expiresAt: Date.now() + TTL_MS,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // localStorage có thể bị full — bỏ qua, vẫn còn RAM cache
  }
}

// ── Core fetch function ───────────────────────────────────────────────────
async function fetchProvinces(): Promise<ProvinceItem[]> {
  // Tier 1: RAM hit
  if (_cache) return _cache

  // Tier 2: localStorage hit
  const stored = readLocalStorage()
  if (stored && stored.length > 0) {
    _cache = stored
    return _cache
  }

  // Dedup: nếu đang có request bay thì chờ chung, không gọi thêm
  if (!_promise) {
    _promise = fetch(PROVINCE_API)
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          _cache = json.data as ProvinceItem[]
          writeLocalStorage(_cache)
          return _cache
        }
        return [] as ProvinceItem[]
      })
      .catch(() => [] as ProvinceItem[])
      .finally(() => {
        _promise = null
        _notifyListeners()
      })
  }

  return _promise
}

// Khởi động prefetch ngay khi module load (không block render)
// Nếu localStorage có data → gán vào RAM cache luôn
;(function prefetch() {
  const stored = readLocalStorage()
  if (stored && stored.length > 0) {
    _cache = stored
  }
})()

// ── Hook: useProvinces (có cả ward) ──────────────────────────────────────
export function useProvinces() {
  const [data, setData] = useState<ProvinceItem[]>(_cache ?? [])
  const [loading, setLoading] = useState(_cache === null)

  useEffect(() => {
    if (_cache) {
      setData(_cache)
      setLoading(false)
      return
    }

    const update = () => {
      if (_cache) {
        setData([..._cache])
        setLoading(false)
      }
    }
    _listeners.add(update)

    fetchProvinces().then(result => {
      setData(result)
      setLoading(false)
    })

    return () => {
      _listeners.delete(update)
    }
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

// ── Hook: useProvinceNames (chỉ tên tỉnh, cho search bar) ────────────────
export function useProvinceNames(withExtras = true) {
  const [options, setOptions] = useState<ProvinceOption[]>(() => {
    // Init từ cache ngay (không chờ useEffect) nếu đã có
    if (_cache && _cache.length > 0) {
      return buildNameOptions(_cache, withExtras)
    }
    return []
  })
  const [loading, setLoading] = useState(_cache === null)

  useEffect(() => {
    if (_cache && _cache.length > 0) {
      setOptions(buildNameOptions(_cache, withExtras))
      setLoading(false)
      return
    }

    const update = () => {
      if (_cache) {
        setOptions(buildNameOptions(_cache, withExtras))
        setLoading(false)
      }
    }
    _listeners.add(update)

    fetchProvinces().then(result => {
      setOptions(buildNameOptions(result, withExtras))
      setLoading(false)
    })

    return () => {
      _listeners.delete(update)
    }
  }, [withExtras])

  return { options, loading }
}

function buildNameOptions(list: ProvinceItem[], withExtras: boolean): ProvinceOption[] {
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
