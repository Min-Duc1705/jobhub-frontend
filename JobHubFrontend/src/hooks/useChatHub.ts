/**
 * useChatHub — Singleton SignalR Chat Hub connection
 *
 * CHỈ tạo 1 kết nối ws/chat duy nhất cho toàn app.
 * Các component (Header, FloatingChatWidget, ChatPage, HireAgentManagement)
 * đều subscribe vào cùng 1 connection thay vì tạo connection riêng.
 *
 * Cách dùng:
 *   const { connection, isConnected } = useChatHub()
 *   connection?.invoke('SendPrivateMessage', ...)
 *   connection?.on('ReceiveMessage', handler)   // ← tự cleanup khi unmount
 */
import { useState, useEffect, useRef } from 'react'
import { HubConnectionBuilder, HubConnection, LogLevel, HubConnectionState } from '@microsoft/signalr'

// ── Module-level singleton ──────────────────────────────────────────────────
let _connection: HubConnection | null = null
let _starting: Promise<void> | null = null
let _userId: string | null = null

const _listeners = new Set<(conn: HubConnection | null, connected: boolean) => void>()

function _notify(conn: HubConnection | null, connected: boolean) {
  _listeners.forEach(fn => fn(conn, connected))
}

/** Khởi động connection nếu chưa có, hoặc đang disconnect */
async function _ensureConnected(userId: string) {
  const socketUrl = import.meta.env.VITE_NOTIFICATION_SOCKET_URL || 'http://localhost:5008'

  // Nếu user thay đổi → disconnect connection cũ
  if (_connection && _userId && _userId !== userId) {
    await _connection.stop().catch(() => {})
    _connection = null
    _starting = null
    _userId = null
  }

  if (_connection?.state === HubConnectionState.Connected) return
  if (_starting) return _starting

  const token = localStorage.getItem('access_token')
  const conn = new HubConnectionBuilder()
    .withUrl(`${socketUrl}/ws/chat`, {
      accessTokenFactory: () => localStorage.getItem('access_token') || token || '',
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build()

  conn.onreconnecting(() => _notify(conn, false))
  conn.onreconnected(() => _notify(conn, true))
  conn.onclose(() => {
    _connection = null
    _starting = null
    _userId = null
    _notify(null, false)
  })

  _starting = conn.start()
    .then(() => {
      _connection = conn
      _userId = userId
      _starting = null
      _notify(conn, true)
    })
    .catch(err => {
      console.error('[ChatHub] Connection failed:', err)
      _starting = null
      _notify(null, false)
    })

  return _starting
}

/** Ngắt kết nối (khi user logout) */
export async function disconnectChatHub() {
  if (_connection) {
    await _connection.stop().catch(() => {})
    _connection = null
    _starting = null
    _userId = null
    _notify(null, false)
  }
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function useChatHub(userId: string | null | undefined) {
  const [connection, setConnection] = useState<HubConnection | null>(_connection)
  const [isConnected, setIsConnected] = useState(
    _connection?.state === HubConnectionState.Connected
  )

  // Memoize handlers được đăng ký bên ngoài để có thể cleanup đúng
  const handlersRef = useRef<Array<{ event: string; handler: (...args: any[]) => void }>>([])

  useEffect(() => {
    if (!userId) return

    // Subscribe to connection state changes
    const onStateChange = (conn: HubConnection | null, connected: boolean) => {
      setConnection(conn)
      setIsConnected(connected)
    }
    _listeners.add(onStateChange)

    // Sync immediately with current state
    setConnection(_connection)
    setIsConnected(_connection?.state === HubConnectionState.Connected)

    // Kick off connection
    _ensureConnected(userId)

    return () => {
      _listeners.delete(onStateChange)
    }
  }, [userId])

  return { connection, isConnected }
}

/**
 * Tiện ích: đăng ký listener trên connection hiện tại.
 * Tự động off khi component unmount.
 * Dùng trong useEffect của component consumer.
 */
export function useChatHubEvent<T extends any[]>(
  connection: HubConnection | null,
  event: string,
  handler: (...args: T) => void
) {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!connection) return
    const fn = (...args: T) => handlerRef.current(...args)
    connection.on(event, fn)
    return () => { connection.off(event, fn) }
  }, [connection, event])
}
