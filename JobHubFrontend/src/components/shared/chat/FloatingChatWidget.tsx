import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Avatar, Input, Button, Spin } from 'antd'
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr'
import { useAppSelector } from '../../../redux/hooks'
import {
  getChatHistoryApi,
  sendChatMessageApi,
  getConversationsApi,
  type IMessageDto
} from '../../../services/chat-service'
import './FloatingChatWidget.scss'

interface IFloatingConv {
  conversationId: string
  otherUserId: string
  otherUserName: string
  otherUserAvatar?: string
}

const FloatingChatWidget = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const { user } = useAppSelector((state) => state.auth)
  const currentUserId = user?.id || ''

  const [activeConv, setActiveConv] = useState<IFloatingConv | null>(null)
  const [isMinimized, setIsMinimized] = useState(true)
  const [messages, setMessages] = useState<IMessageDto[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const [connection, setConnection] = useState<HubConnection | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)

  // Use a ref for isMinimized to prevent WebSocket reconnection on toggle
  const isMinimizedRef = useRef(isMinimized)
  useEffect(() => {
    isMinimizedRef.current = isMinimized
  }, [isMinimized])

  // 1. Listen to localStorage and custom events to open the floating chat
  useEffect(() => {
    const loadFromStorage = () => {
      const stored = localStorage.getItem('floating_chat')
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as IFloatingConv & { isMinimized?: boolean }
          setActiveConv(parsed)
          setIsMinimized(parsed.isMinimized !== false)
        } catch (e) {}
      } else {
        setActiveConv(null)
      }
    }

    loadFromStorage()
    window.addEventListener('floating_chat_changed', loadFromStorage)
    window.addEventListener('storage', loadFromStorage)

    return () => {
      window.removeEventListener('floating_chat_changed', loadFromStorage)
      window.removeEventListener('storage', loadFromStorage)
    }
  }, [])

  // 2. Fetch history when activeConv changes and widget is expanded
  useEffect(() => {
    if (!activeConv || isMinimized) return

    const fetchHistory = async () => {
      try {
        setLoading(true)
        const res = await getChatHistoryApi(activeConv.conversationId, 30)
        if (res && res.data) {
          setMessages(res.data)
          scrollToBottom()
        }
      } catch (err) {
        console.error('Error fetching floating chat history:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
    setUnreadCount(0) // reset local unread when expanding
  }, [activeConv, isMinimized])

  // 2b. Mark conversation as read on the backend when expanded
  useEffect(() => {
    if (!activeConv || isMinimized || !connection) return
    connection.invoke('MarkConversationAsRead', activeConv.conversationId, activeConv.otherUserId)
      .catch(e => console.error('Error invoking MarkConversationAsRead:', e))
  }, [activeConv, isMinimized, connection])

  // 3. Connect to Hub for real-time messages in the floating widget
  useEffect(() => {
    if (!activeConv || !currentUserId || location.pathname === '/chat') {
      if (connection) {
        connection.stop()
        setConnection(null)
      }
      return
    }

    const token = localStorage.getItem('access_token')
    const socketUrl = import.meta.env.VITE_NOTIFICATION_SOCKET_URL || 'http://localhost:5008'
    const newConnection = new HubConnectionBuilder()
      .withUrl(`${socketUrl}/ws/chat`, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    newConnection.start()
      .then(() => {
        setConnection(newConnection)
        // Mark read initially
        newConnection.invoke('MarkConversationAsRead', activeConv.conversationId, activeConv.otherUserId)
          .catch(e => console.error(e))
      })
      .catch(err => console.error('Floating chat Hub failed:', err))

    newConnection.on('ReceiveMessage', (msg: IMessageDto) => {
      if (msg.conversationId === activeConv.conversationId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        scrollToBottom()

        // Auto mark as read if expanded, else increment local badge on the bubble
        if (!isMinimizedRef.current) {
          if (msg.senderId.toLowerCase() !== currentUserId.toLowerCase()) {
            newConnection.invoke('MarkConversationAsRead', activeConv.conversationId, msg.senderId)
              .catch(e => console.error(e))
          }
        } else {
          if (msg.senderId.toLowerCase() !== currentUserId.toLowerCase()) {
            setUnreadCount(c => c + 1)
          }
        }
      }
    })

    newConnection.on('ConversationRead', (data: { conversationId: string; readerId: string }) => {
      if (data.conversationId === activeConv.conversationId) {
        setMessages(prev => prev.map(m =>
          m.senderId.toLowerCase() === currentUserId.toLowerCase() ? { ...m, isRead: true } : m
        ))
      }
    })

    return () => {
      newConnection.stop()
    }
  }, [activeConv, location.pathname, currentUserId])

  // 4. Fetch initial unread count from server
  useEffect(() => {
    if (!activeConv || !currentUserId) return

    const fetchUnreadCount = async () => {
      try {
        const res = await getConversationsApi()
        if (res && res.data) {
          const matching = res.data.find(c => c.id === activeConv.conversationId)
          if (matching) {
            setUnreadCount(matching.unreadCount)
          }
        }
      } catch (err) {
        console.error('Error fetching unread count for floating chat:', err)
      }
    }

    fetchUnreadCount()
  }, [activeConv, currentUserId])

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }
    }, 100)
  }

  const handleSend = async () => {
    if (!inputText.trim() || !activeConv) return
    const textToSend = inputText.trim()
    setInputText('')

    try {
      if (connection) {
        await connection.invoke('SendPrivateMessage', activeConv.otherUserId, textToSend, 'text')
      } else {
        const res = await sendChatMessageApi(activeConv.otherUserId, textToSend, 'text')
        if (res && res.data) {
          setMessages(prev => [...prev, res.data])
          scrollToBottom()
        }
      }
    } catch (err) {
      console.error('Error sending floating message:', err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const setFloatingChatMinimized = (minimized: boolean) => {
    setIsMinimized(minimized)
    const stored = localStorage.getItem('floating_chat')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        parsed.isMinimized = minimized
        localStorage.setItem('floating_chat', JSON.stringify(parsed))
      } catch (e) {}
    }
  }

  const handleClose = () => {
    localStorage.removeItem('floating_chat')
    setActiveConv(null)
    window.dispatchEvent(new Event('floating_chat_changed'))
  }

  const handleGoToFullChat = () => {
    setFloatingChatMinimized(true)
    navigate(`/chat?userId=${activeConv?.otherUserId}`)
  }

  // Hide the floating widget entirely if we are on the main /chat page
  if (!activeConv || location.pathname === '/chat') return null

  return (
    <div className="floating-chat-widget">
      {/* ── BUBBLE CHAT HEAD ── */}
      {isMinimized && (
        <button 
          className="floating-chat-bubble"
          onClick={() => setFloatingChatMinimized(false)}
          title={activeConv.otherUserName}
        >
          <Avatar 
            size={56} 
            src={activeConv.otherUserAvatar} 
            className="floating-chat-bubble__avatar"
          >
            {activeConv.otherUserName[0]?.toUpperCase()}
          </Avatar>
          <span className="floating-chat-bubble__status-dot"></span>
          {unreadCount > 0 && (
            <span className="floating-chat-bubble__badge">{unreadCount}</span>
          )}
        </button>
      )}

      {/* ── CHAT WINDOW BOX ── */}
      {!isMinimized && (
        <div className="floating-chat-box">
          {/* Header */}
          <div className="floating-chat-box__header">
            <div className="floating-chat-box__header-left" onClick={handleGoToFullChat} style={{ cursor: 'pointer' }}>
              <div className="floating-chat-box__header-avatar-container">
                <Avatar 
                  size={32} 
                  src={activeConv.otherUserAvatar} 
                  className="floating-chat-box__header-avatar"
                >
                  {activeConv.otherUserName[0]?.toUpperCase()}
                </Avatar>
                <span className="floating-chat-box__header-status-dot"></span>
              </div>
              <div className="floating-chat-box__header-info">
                <h4>{activeConv.otherUserName}</h4>
                <span>Online</span>
              </div>
            </div>
            <div className="floating-chat-box__header-actions">
              <Button 
                type="text" 
                icon={<span className="material-symbols-outlined">remove</span>} 
                className="action-btn"
                onClick={() => setFloatingChatMinimized(true)}
              />
              <Button 
                type="text" 
                icon={<span className="material-symbols-outlined">close</span>} 
                className="action-btn"
                onClick={handleClose}
              />
            </div>
          </div>

          {/* Messages list */}
          <div className="floating-chat-box__messages custom-scrollbar" ref={messagesContainerRef}>
            {loading ? (
              <div className="chat-spin-wrap">
                <Spin size="small" />
              </div>
            ) : messages.length > 0 ? (
              messages.map((m) => {
                const isMe = m.senderId.toLowerCase() === currentUserId.toLowerCase()
                return (
                  <div key={m.id} className={`floating-msg ${isMe ? 'floating-msg--me' : 'floating-msg--other'}`}>
                    <div className="floating-msg__text">{m.content}</div>
                    <div className="floating-msg__time">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && (
                        <span className="floating-msg__status">
                          {m.isRead ? (
                            <span className="material-symbols-outlined read-icon">done_all</span>
                          ) : (
                            <span className="material-symbols-outlined send-icon">done_all</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="floating-chat-box__empty-feed">
                <p>Bắt đầu cuộc trò chuyện mới!</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="floating-chat-box__footer">
            <div className="floating-chat-input-container">
              <Input.TextArea
                placeholder="Nhập tin nhắn..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                autoSize={{ minRows: 1, maxRows: 3 }}
                className="floating-chat-input-textarea"
                bordered={false}
              />
              <div className="floating-chat-input-toolbar">
                <div className="toolbar-left">
                  <Button type="text" icon={<span className="material-symbols-outlined">attach_file</span>} className="t-btn" />
                  <Button type="text" icon={<span className="material-symbols-outlined">image</span>} className="t-btn" />
                  <Button type="text" icon={<span className="material-symbols-outlined">mood</span>} className="t-btn" />
                </div>
                <Button
                  type="primary"
                  className="floating-send-btn"
                  onClick={handleSend}
                >
                  <span className="material-symbols-outlined">send</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FloatingChatWidget
