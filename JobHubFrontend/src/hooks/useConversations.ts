/**
 * useConversations — Shared hook với module-level cache
 *
 * - Chỉ gọi API 1 lần dù có bao nhiêu component mount
 * - Cache gắn với userId: khi user thay đổi → reset, fetch lại
 * - Tự động invalidate khi nhận tin nhắn mới (SignalR / custom event)
 * - Dùng chung cho: HeaderClient (badge), FloatingChatWidget (unread)
 *
 * QUAN TRỌNG: enabled phải là !!user?.id (không dùng isAuthenticated)
 * để tránh fetch khi có token nhưng chưa có user object.
 */
import { useState, useEffect, useCallback } from 'react'
import { getConversationsApi } from '../services/chat-service'

export interface IConversationSummary {
  id: string
  otherUserId: string
  otherUserName: string
  otherUserAvatar?: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
  [key: string]: any
}

// ── Module-level shared state ─────────────────────────────────────────────
let _conversations: IConversationSummary[] = []
let _loading = false
let _fetched = false
let _promise: Promise<void> | null = null
let _currentUserId: string | null = null   // track user để reset khi user đổi

const _listeners = new Set<() => void>()

function _notify() {
  _listeners.forEach(fn => fn())
}

/** Reset toàn bộ cache — gọi khi user thay đổi hoặc logout */
function _resetCache() {
  _conversations = []
  _loading = false
  _fetched = false
  _promise = null
}

async function _fetch(userId: string, force = false) {
  // Nếu user thay đổi → reset cache ngay
  if (_currentUserId !== userId) {
    _resetCache()
    _currentUserId = userId
  }

  if (_fetched && !force) return
  if (_loading && !force) {
    return _promise ?? undefined
  }

  _loading = true
  _promise = getConversationsApi()
    .then(res => {
      if (res?.data) {
        _conversations = res.data as unknown as IConversationSummary[]
      }
    })
    .catch(() => {})
    .finally(() => {
      _loading = false
      _fetched = true
      _promise = null
      _notify()
    })

  return _promise
}

/** Gọi từ ngoài để invalidate cache (vd: khi nhận tin nhắn mới qua SignalR) */
export function invalidateConversationsCache() {
  if (!_currentUserId) return   // chưa login, không cần fetch
  _fetched = false
  _fetch(_currentUserId, true)
}

// ── Hook ─────────────────────────────────────────────────────────────────
/**
 * @param userId  Truyền user?.id (string) hoặc null/undefined khi chưa login.
 *                KHÔNG dùng isAuthenticated vì nó = true ngay khi có token
 *                nhưng user object chưa được load.
 */
export function useConversations(userId: string | null | undefined) {
  const enabled = !!userId

  const [conversations, setConversations] = useState<IConversationSummary[]>(
    // Chỉ dùng cache nếu đúng user
    userId && _currentUserId === userId ? _conversations : []
  )
  const [loading, setLoading] = useState(
    enabled && (!_fetched || _loading)
  )

  useEffect(() => {
    if (!userId) {
      // User logout / chưa login → clear local state
      setConversations([])
      setLoading(false)
      return
    }

    const update = () => {
      setConversations([..._conversations])
      setLoading(_loading)
    }

    _listeners.add(update)

    // Kick off fetch nếu chưa có data cho user này
    if (_currentUserId !== userId || (!_fetched && !_loading)) {
      setLoading(true)
      _fetch(userId)
    } else if (_fetched) {
      // Cache hit → sync ngay
      setConversations([..._conversations])
      setLoading(false)
    }

    return () => {
      _listeners.delete(update)
    }
  }, [userId])

  const refetch = useCallback(() => {
    if (!_currentUserId) return
    _fetched = false
    setLoading(true)
    _fetch(_currentUserId, true)
  }, [])

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0)

  return { conversations, loading, totalUnread, refetch }
}
