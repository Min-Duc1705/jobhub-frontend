/**
 * useConversations — Shared hook với module-level cache
 *
 * - Chỉ gọi API 1 lần dù có bao nhiêu component mount
 * - Tự động invalidate khi nhận tin nhắn mới (SignalR / custom event)
 * - Dùng chung cho: HeaderClient (badge), FloatingChatWidget (unread)
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
const _listeners = new Set<() => void>()

function _notify() {
  _listeners.forEach(fn => fn())
}

async function _fetch(force = false) {
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
  _fetched = false
  _fetch(true)
}

// ── Hook ─────────────────────────────────────────────────────────────────
export function useConversations(enabled = true) {
  const [conversations, setConversations] = useState<IConversationSummary[]>(_conversations)
  const [loading, setLoading] = useState(_loading || (!_fetched && enabled))

  // Subscribe to module-level updates
  useEffect(() => {
    if (!enabled) return

    const update = () => {
      setConversations([..._conversations])
      setLoading(_loading)
    }

    _listeners.add(update)

    // Kick off fetch if not done yet
    if (!_fetched && !_loading) {
      setLoading(true)
      _fetch()
    } else if (_fetched) {
      // Already cached — sync immediately
      setConversations([..._conversations])
      setLoading(false)
    }

    return () => {
      _listeners.delete(update)
    }
  }, [enabled])

  const refetch = useCallback(() => {
    _fetched = false
    setLoading(true)
    _fetch(true)
  }, [])

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0)

  return { conversations, loading, totalUnread, refetch }
}
