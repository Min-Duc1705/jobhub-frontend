import React from 'react'

interface TimeAgoProps {
  date: string | Date | undefined
  prefix?: string
  style?: React.CSSProperties
}

/** Formats a date string or object into a relative time phrase */
export const formatTimeAgo = (dateStr: string | Date | undefined): string => {
  if (!dateStr) return '—'
  const dateObj = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  const diff = Date.now() - dateObj.getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'Vừa đăng'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} ngày trước`
  return `${Math.floor(d / 30)} tháng trước`
}

const TimeAgo: React.FC<TimeAgoProps> = ({ date, prefix = '', style }) => {
  const formatted = formatTimeAgo(date)
  if (formatted === '—') return <span style={style}>—</span>
  return <span style={style}>{prefix}{formatted}</span>
}

export default TimeAgo
