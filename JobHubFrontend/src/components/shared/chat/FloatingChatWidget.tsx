import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Avatar, Input, Button, Spin, Popover, List } from 'antd'
import { message } from '../../../utils/antd'
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr'
import { useAppSelector } from '../../../redux/hooks'
import {
  getChatHistoryApi,
  sendChatMessageApi,
  getConversationsApi,
  type IMessageDto
} from '../../../services/chat-service'
import { uploadCompanyPublicImageApi } from '../../../services/company-service'
import { uploadResumeFileApi, getMyResumesApi } from '../../../services/resume-service'
import { getJobsApi } from '../../../services/job-service'
import { POPULAR_EMOJIS, CANDIDATE_TEMPLATES, HR_TEMPLATES } from './chat-features'
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
  const textareaRef = useRef<any>(null)

  // Popover States
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [mentionOpen, setMentionOpen] = useState(false)
  const [resumes, setResumes] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [loadingShortcuts, setLoadingShortcuts] = useState(false)

  // Role details
  const isHR = user?.role?.name === 'HR'
  const isCandidate = user?.role?.name === 'CANDIDATE' || (!isHR && !!user)

  // Load shortcuts on popover open
  const loadShortcuts = async (visible: boolean) => {
    if (!visible) return
    setLoadingShortcuts(true)
    try {
      if (isCandidate) {
        const res = await getMyResumesApi(currentUserId)
        if (res && res.data && res.data.result) {
          setResumes(res.data.result)
        }
      } else if (isHR) {
        const res = await getJobsApi("pageNumber=1&pageSize=10&sortBy=createdDate&isDescending=true")
        if (res && res.data && res.data.result) {
          setJobs(res.data.result)
        }
      }
    } catch (err) {
      console.error("Error loading shortcuts:", err)
    } finally {
      setLoadingShortcuts(false)
    }
  }

  // Insert Emoji at cursor position
  const insertEmoji = (emoji: string) => {
    const rawTextarea = textareaRef.current?.resizableTextArea?.textArea
    if (rawTextarea) {
      const start = rawTextarea.selectionStart
      const end = rawTextarea.selectionEnd
      const text = rawTextarea.value
      const newText = text.substring(0, start) + emoji + text.substring(end)
      setInputText(newText)
      setTimeout(() => {
        rawTextarea.focus()
        rawTextarea.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0)
    } else {
      setInputText(prev => prev + emoji)
    }
    setEmojiOpen(false)
  }

  // Insert Text at cursor position
  const insertTextAtCursor = (insertedText: string) => {
    const rawTextarea = textareaRef.current?.resizableTextArea?.textArea
    if (rawTextarea) {
      const start = rawTextarea.selectionStart
      const end = rawTextarea.selectionEnd
      const text = rawTextarea.value
      const newText = text.substring(0, start) + insertedText + text.substring(end)
      setInputText(newText)
      setTimeout(() => {
        rawTextarea.focus()
        rawTextarea.setSelectionRange(start + insertedText.length, start + insertedText.length)
      }, 0)
    } else {
      setInputText(prev => prev + insertedText)
    }
    setMentionOpen(false)
  }

  // Custom text input change to trigger mentions on '@'
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputText(value)
    if (value.endsWith('@')) {
      setMentionOpen(true)
      loadShortcuts(true)
    }
  }

  // Emoji popover content
  const emojiContent = (
    <div className="emoji-picker-popover" style={{ width: '200px', padding: '2px' }}>
      <div 
        className="emoji-picker-grid" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(6, 1fr)', 
          gap: '6px', 
          maxHeight: '130px', 
          overflowY: 'auto' 
        }}
      >
        {POPULAR_EMOJIS.map((emoji, idx) => (
          <span 
            key={idx} 
            className="emoji-picker-item"
            style={{ 
              fontSize: '18px', 
              cursor: 'pointer', 
              textAlign: 'center', 
              padding: '2px',
              borderRadius: '4px',
              transition: 'background 0.2s',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f0f0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            onClick={() => insertEmoji(emoji)}
          >
            {emoji}
          </span>
        ))}
      </div>
    </div>
  )

  // Mentions popover content
  const mentionContent = (
    <div className="mention-picker-popover custom-scrollbar" style={{ maxHeight: '240px', width: '260px', overflowY: 'auto', padding: '2px' }}>
      <div className="mention-section-title" style={{ fontSize: '11px', fontWeight: 600, color: '#8c8c8c', padding: '4px 6px', borderBottom: '1px solid #f0f0f0' }}>Tin nhắn mẫu</div>
      <List
        size="small"
        dataSource={isHR ? HR_TEMPLATES : CANDIDATE_TEMPLATES}
        renderItem={(item) => (
          <List.Item 
            className="mention-list-item" 
            onClick={() => insertTextAtCursor(item.text)}
            style={{ cursor: 'pointer', padding: '6px', borderBottom: '1px solid #f0f0f0' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <span style={{ fontWeight: 500, fontSize: '11px', color: '#1f1f1f' }}>{item.label}</span>
              <span style={{ fontSize: '10px', color: '#8c8c8c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '230px', marginTop: '2px' }}>
                {item.text}
              </span>
            </div>
          </List.Item>
        )}
      />

      {isCandidate && (
        <>
          <div className="mention-section-title" style={{ fontSize: '11px', fontWeight: 600, color: '#8c8c8c', padding: '6px 6px 4px', borderBottom: '1px solid #f0f0f0', marginTop: '6px' }}>Đính kèm nhanh CV</div>
          {loadingShortcuts ? (
            <div style={{ textAlign: 'center', padding: '6px' }}><Spin size="small" /></div>
          ) : resumes.length > 0 ? (
            <List
              size="small"
              dataSource={resumes}
              renderItem={(r) => (
                <List.Item 
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', borderBottom: '1px solid #f5f5f5' }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>
                    📄 {r.title}
                  </span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <Button 
                      type="dashed"
                      size="small"
                      style={{ fontSize: '9px', height: '18px', padding: '0 4px', borderRadius: '3px' }}
                      onClick={() => insertTextAtCursor(` [CV: ${r.title}](${r.url}) `)}
                    >
                      Chèn
                    </Button>
                    <Button 
                      type="primary"
                      size="small"
                      style={{ fontSize: '9px', height: '18px', padding: '0 4px', borderRadius: '3px' }}
                      onClick={async () => {
                        await handleSend(r.url, 'file')
                        setMentionOpen(false)
                      }}
                    >
                      Gửi
                    </Button>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div style={{ fontSize: '10px', color: '#8c8c8c', padding: '6px', textAlign: 'center' }}>Chưa tải CV lên</div>
          )}
        </>
      )}

      {isHR && (
        <>
          <div className="mention-section-title" style={{ fontSize: '11px', fontWeight: 600, color: '#8c8c8c', padding: '6px 6px 4px', borderBottom: '1px solid #f0f0f0', marginTop: '6px' }}>Chia sẻ tin tuyển dụng</div>
          {loadingShortcuts ? (
            <div style={{ textAlign: 'center', padding: '6px' }}><Spin size="small" /></div>
          ) : jobs.length > 0 ? (
            <List
              size="small"
              dataSource={jobs}
              renderItem={(j) => (
                <List.Item 
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', borderBottom: '1px solid #f5f5f5' }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>
                    💼 {j.title}
                  </span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <Button 
                      type="dashed"
                      size="small"
                      style={{ fontSize: '9px', height: '18px', padding: '0 4px', borderRadius: '3px' }}
                      onClick={() => insertTextAtCursor(` [Tin tuyển dụng: ${j.title}](${window.location.origin}/jobs/${j.id}) `)}
                    >
                      Chèn
                    </Button>
                    <Button 
                      type="primary"
                      size="small"
                      style={{ fontSize: '9px', height: '18px', padding: '0 4px', borderRadius: '3px' }}
                      onClick={async () => {
                        await handleSend(`${window.location.origin}/jobs/${j.id}`, 'text')
                        setMentionOpen(false)
                      }}
                    >
                      Gửi
                    </Button>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div style={{ fontSize: '10px', color: '#8c8c8c', padding: '6px', textAlign: 'center' }}>Chưa có tin tuyển dụng</div>
          )}
        </>
      )}
    </div>
  )

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

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 20 * 1024 * 1024) {
      message.error('Tệp tin không được vượt quá 20MB!')
      return
    }

    const hide = message.loading('Đang tải tệp tin lên...', 0)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadResumeFileApi(formData)
      if (res && res.data && res.data.url) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
        const cleanBackendUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl
        const fileUrl = res.data.fullUrl || (res.data.url.startsWith('http') ? res.data.url : `${cleanBackendUrl}/resumes/${res.data.url}`)
        await handleSend(fileUrl, 'file')
        message.success('Gửi tệp tin thành công!')
      } else {
        message.error('Không thể tải tệp tin lên!')
      }
    } catch (err) {
      console.error('File upload error:', err)
      message.error('Lỗi tải tệp tin lên!')
    } finally {
      hide()
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      message.error('Hình ảnh không được vượt quá 10MB!')
      return
    }

    const hide = message.loading('Đang tải hình ảnh lên...', 0)
    try {
      const res = await uploadCompanyPublicImageApi(file)
      if (res && res.data && res.data.url) {
        await handleSend(res.data.url, 'image')
        message.success('Gửi ảnh thành công!')
      } else {
        message.error('Không thể tải hình ảnh lên!')
      }
    } catch (err) {
      console.error('Image upload error:', err)
      message.error('Lỗi tải hình ảnh lên!')
    } finally {
      hide()
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handleSend = async (customContent?: string, customType?: string) => {
    const textToSend = customContent !== undefined ? customContent : inputText.trim()
    const messageType = customType !== undefined ? customType : 'text'

    if (!textToSend || !activeConv) return

    try {
      if (connection) {
        await connection.invoke('SendPrivateMessage', activeConv.otherUserId, textToSend, messageType)
      } else {
        const res = await sendChatMessageApi(activeConv.otherUserId, textToSend, messageType)
        if (res && res.data) {
          setMessages(prev => [...prev, res.data])
          scrollToBottom()
        }
      }
      if (customContent === undefined) {
        setInputText('')
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
                    <div className="floating-msg__text">
                      {m.type?.toLowerCase() === 'image' ? (
                        <img 
                          src={m.content} 
                          alt="Shared Image" 
                          style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '6px', cursor: 'pointer' }}
                          onClick={() => window.open(m.content, '_blank')}
                        />
                      ) : m.type?.toLowerCase() === 'file' ? (
                        <a 
                          href={m.content} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isMe ? '#fff' : 'inherit', textDecoration: 'underline' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>description</span>
                          <span style={{ fontSize: '12px', wordBreak: 'break-all' }}>{m.content.split('/').pop() || 'Tài liệu'}</span>
                        </a>
                      ) : (
                        m.content
                      )}
                    </div>
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
                ref={textareaRef}
                placeholder="Nhập tin nhắn... (Gõ @ để xem phím tắt)"
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                rows={1}
                autoSize={{ minRows: 1, maxRows: 3 }}
                className="floating-chat-input-textarea"
                bordered={false}
              />
              <div className="floating-chat-input-toolbar">
                <div className="toolbar-left">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange} 
                  />
                  <input 
                    type="file" 
                    ref={imageInputRef} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    onChange={handleImageChange} 
                  />
                  <Button 
                    type="text" 
                    icon={<span className="material-symbols-outlined">attach_file</span>} 
                    className="t-btn" 
                    onClick={() => fileInputRef.current?.click()}
                  />
                  <Button 
                    type="text" 
                    icon={<span className="material-symbols-outlined">image</span>} 
                    className="t-btn" 
                    onClick={() => imageInputRef.current?.click()}
                  />
                  
                  <Popover
                    content={emojiContent}
                    title="Chọn Emoji"
                    trigger="click"
                    open={emojiOpen}
                    onOpenChange={setEmojiOpen}
                    placement="topRight"
                  >
                    <Button 
                      type="text" 
                      icon={<span className="material-symbols-outlined">mood</span>} 
                      className="t-btn" 
                    />
                  </Popover>

                  <Popover
                    content={mentionContent}
                    title={isHR ? "Phím tắt & Tin tuyển dụng (@)" : "Phím tắt & Hồ sơ ứng tuyển (@)"}
                    trigger="click"
                    open={mentionOpen}
                    onOpenChange={(visible) => {
                      setMentionOpen(visible)
                      loadShortcuts(visible)
                    }}
                    placement="topRight"
                  >
                    <Button 
                      type="text" 
                      icon={<span className="material-symbols-outlined">alternate_email</span>} 
                      className="t-btn" 
                    />
                  </Popover>
                </div>
                <Button
                  type="primary"
                  className="floating-send-btn"
                  onClick={() => handleSend()}
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
