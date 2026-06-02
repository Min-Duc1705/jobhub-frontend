import { useRef, useState } from 'react'
import { Avatar, Button, Spin, Input, message, Popover, List } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { IConversationDto, IMessageDto } from '../../../services/chat-service'
import { uploadCompanyPublicImageApi } from '../../../services/company-service'
import { uploadResumeFileApi, getMyResumesApi } from '../../../services/resume-service'
import { getJobsApi } from '../../../services/job-service'
import { useAppSelector } from '../../../redux/hooks'
import { POPULAR_EMOJIS, CANDIDATE_TEMPLATES, HR_TEMPLATES } from './chat-features'

interface ChatWindowProps {
  activeConversation: IConversationDto | null
  messages: IMessageDto[]
  profiles: Record<string, { name: string; avatar?: string }>
  currentUserId: string
  loadingMessages: boolean
  inputText: string
  setInputText: (text: string) => void
  handleSendMessage: (customContent?: string, customType?: string) => Promise<void>
  handleKeyPress: (e: any) => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
}

const ChatWindow = ({
  activeConversation,
  messages,
  profiles,
  currentUserId,
  loadingMessages,
  inputText,
  setInputText,
  handleSendMessage,
  messagesEndRef,
  messagesContainerRef
}: ChatWindowProps) => {
  const navigate = useNavigate()

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<any>(null)

  // Popover States
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [mentionOpen, setMentionOpen] = useState(false)
  const [resumes, setResumes] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [loadingShortcuts, setLoadingShortcuts] = useState(false)

  // Redux Auth state for checking role
  const { user } = useAppSelector((state) => state.auth)
  const isHR = user?.role?.name === 'HR'
  const isCandidate = user?.role?.name === 'CANDIDATE' || (!isHR && !!user)

  // Load shortcuts (resumes or jobs) on popover open
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

  // Insert Emoji at current cursor position
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
      setInputText(inputText + emoji)
    }
    setEmojiOpen(false)
  }

  // Insert Text at current cursor position
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
      setInputText(inputText + insertedText)
    }
    setMentionOpen(false)
  }

  // Handle onChange on TextArea to trigger Popover when typing '@'
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputText(value)
    if (value.endsWith('@')) {
      setMentionOpen(true)
      loadShortcuts(true)
    }
  }

  // Emoji Popover Content
  const emojiContent = (
    <div className="emoji-picker-popover" style={{ width: '240px', padding: '4px' }}>
      <div 
        className="emoji-picker-grid" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(8, 1fr)', 
          gap: '8px', 
          maxHeight: '160px', 
          overflowY: 'auto' 
        }}
      >
        {POPULAR_EMOJIS.map((emoji, idx) => (
          <span 
            key={idx} 
            className="emoji-picker-item"
            style={{ 
              fontSize: '20px', 
              cursor: 'pointer', 
              textAlign: 'center', 
              padding: '4px',
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

  // Mentions (@) Popover Content
  const mentionContent = (
    <div className="mention-picker-popover custom-scrollbar" style={{ maxHeight: '300px', width: '280px', overflowY: 'auto', padding: '4px' }}>
      <div className="mention-section-title" style={{ fontSize: '12px', fontWeight: 600, color: '#8c8c8c', padding: '4px 8px', borderBottom: '1px solid #f0f0f0' }}>Tin nhắn mẫu</div>
      <List
        size="small"
        dataSource={isHR ? HR_TEMPLATES : CANDIDATE_TEMPLATES}
        renderItem={(item) => (
          <List.Item 
            className="mention-list-item" 
            onClick={() => insertTextAtCursor(item.text)}
            style={{ cursor: 'pointer', padding: '8px', borderBottom: '1px solid #f0f0f0' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <span style={{ fontWeight: 500, fontSize: '12px', color: '#1f1f1f' }}>{item.label}</span>
              <span style={{ fontSize: '11px', color: '#8c8c8c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px', marginTop: '2px' }}>
                {item.text}
              </span>
            </div>
          </List.Item>
        )}
      />

      {isCandidate && (
        <>
          <div className="mention-section-title" style={{ fontSize: '12px', fontWeight: 600, color: '#8c8c8c', padding: '8px 8px 4px', borderBottom: '1px solid #f0f0f0', marginTop: '8px' }}>Đính kèm nhanh CV</div>
          {loadingShortcuts ? (
            <div style={{ textAlign: 'center', padding: '8px' }}><Spin size="small" /></div>
          ) : resumes.length > 0 ? (
            <List
              size="small"
              dataSource={resumes}
              renderItem={(r) => (
                <List.Item 
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid #f5f5f5' }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>
                    📄 {r.title}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <Button 
                      type="dashed"
                      size="small"
                      style={{ fontSize: '10px', height: '20px', padding: '0 6px', borderRadius: '4px' }}
                      onClick={() => insertTextAtCursor(` [CV: ${r.title}](${r.url}) `)}
                    >
                      Chèn Link
                    </Button>
                    <Button 
                      type="primary"
                      size="small"
                      style={{ fontSize: '10px', height: '20px', padding: '0 6px', borderRadius: '4px' }}
                      onClick={async () => {
                        await handleSendMessage(r.url, 'file')
                        setMentionOpen(false)
                      }}
                    >
                      Gửi file
                    </Button>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div style={{ fontSize: '11px', color: '#8c8c8c', padding: '8px', textAlign: 'center' }}>Chưa có CV nào được tải lên</div>
          )}
        </>
      )}

      {isHR && (
        <>
          <div className="mention-section-title" style={{ fontSize: '12px', fontWeight: 600, color: '#8c8c8c', padding: '8px 8px 4px', borderBottom: '1px solid #f0f0f0', marginTop: '8px' }}>Chia sẻ tin tuyển dụng</div>
          {loadingShortcuts ? (
            <div style={{ textAlign: 'center', padding: '8px' }}><Spin size="small" /></div>
          ) : jobs.length > 0 ? (
            <List
              size="small"
              dataSource={jobs}
              renderItem={(j) => (
                <List.Item 
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid #f5f5f5' }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>
                    💼 {j.title}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <Button 
                      type="dashed"
                      size="small"
                      style={{ fontSize: '10px', height: '20px', padding: '0 6px', borderRadius: '4px' }}
                      onClick={() => insertTextAtCursor(` [Tin tuyển dụng: ${j.title}](${window.location.origin}/jobs/${j.id}) `)}
                    >
                      Chèn Link
                    </Button>
                    <Button 
                      type="primary"
                      size="small"
                      style={{ fontSize: '10px', height: '20px', padding: '0 6px', borderRadius: '4px' }}
                      onClick={async () => {
                        await handleSendMessage(`${window.location.origin}/jobs/${j.id}`, 'text')
                        setMentionOpen(false)
                      }}
                    >
                      Gửi ngay
                    </Button>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div style={{ fontSize: '11px', color: '#8c8c8c', padding: '8px', textAlign: 'center' }}>Chưa có tin tuyển dụng nào</div>
          )}
        </>
      )}
    </div>
  )

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
        await handleSendMessage(fileUrl, 'file')
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
        await handleSendMessage(res.data.url, 'image')
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

  const handleMinimize = () => {
    if (!activeConversation) return
    const otherId = activeConversation.participantA.toLowerCase() === currentUserId.toLowerCase()
      ? activeConversation.participantB
      : activeConversation.participantA
    const profile = profiles[otherId] || { name: 'Người dùng', avatar: undefined }

    localStorage.setItem('floating_chat', JSON.stringify({
      conversationId: activeConversation.id,
      otherUserId: otherId,
      otherUserName: profile.name,
      otherUserAvatar: profile.avatar,
      isMinimized: true
    }))
    window.dispatchEvent(new Event('floating_chat_changed'))
    navigate('/jobs') // Chuyển sang danh sách Job để thấy bong bóng
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="chat-main">
      {activeConversation ? (
        <>
          {/* Chat Header */}
          <div className="chat-main__header">
            {(() => {
              const otherId = activeConversation.participantA.toLowerCase() === currentUserId.toLowerCase()
                ? activeConversation.participantB
                : activeConversation.participantA
              const profile = profiles[otherId] || { name: 'Người dùng', avatar: undefined }
              
              return (
                <div className="chat-main__header-left">
                  <div className="chat-main__header-avatar-container">
                    <Avatar 
                      shape="square"
                      size={36} 
                      src={profile.avatar} 
                      className="chat-main__header-avatar"
                    >
                      {profile.name[0]?.toUpperCase()}
                    </Avatar>
                    <span className="chat-main__header-status-dot"></span>
                  </div>
                  <div className="chat-main__header-info">
                    <h4>{profile.name}</h4>
                    <span className="chat-main__header-status">Online</span>
                  </div>
                </div>
              )
            })()}

            <div className="chat-main__header-actions">
              <Button 
                type="text" 
                icon={<span className="material-symbols-outlined">call</span>} 
                className="chat-header-btn" 
                onClick={() => message.info('Tính năng cuộc gọi đang được phát triển!')}
              />
              <Button 
                type="text" 
                icon={<span className="material-symbols-outlined">videocam</span>} 
                className="chat-header-btn" 
                onClick={() => message.info('Tính năng cuộc gọi video đang được phát triển!')}
              />
              <Button type="text" icon={<span className="material-symbols-outlined">remove</span>} className="chat-header-btn" onClick={handleMinimize} />
              <Button 
                type="text" 
                icon={<span className="material-symbols-outlined">info</span>} 
                className="chat-header-btn" 
                onClick={() => message.info('Tính năng xem chi tiết thông tin đang được phát triển!')}
              />
              <Button 
                type="text" 
                icon={<span className="material-symbols-outlined">more_vert</span>} 
                className="chat-header-btn" 
                onClick={() => message.info('Tính năng mở rộng menu đang được phát triển!')}
              />
            </div>
          </div>

          {/* Chat Messages List */}
          <div className="chat-main__messages custom-scrollbar" ref={messagesContainerRef}>
            {loadingMessages ? (
              <div className="chat-spin-wrap">
                <Spin size="large" />
              </div>
            ) : (
              <>
                {/* Date Separator */}
                <div className="chat-main__date-separator">
                  <span>Hôm nay</span>
                </div>

                {messages.length > 0 ? (
                  messages.map((m) => {
                    const isMe = m.senderId.toLowerCase() === currentUserId.toLowerCase()
                    const profile = profiles[m.senderId] || { name: 'Người dùng', avatar: undefined }
                    
                    return (
                      <div key={m.id} className={`message-bubble ${isMe ? 'message-bubble--me' : 'message-bubble--other'}`}>
                        {!isMe && (
                          <Avatar 
                            shape="square"
                            size={36} 
                            src={profile.avatar} 
                            className="message-bubble__avatar"
                          >
                            {profile.name?.[0]?.toUpperCase() || '?'}
                          </Avatar>
                        )}
                        <div className="message-bubble__content-wrap">
                          <div className="message-bubble__text">
                            {m.type?.toLowerCase() === 'image' ? (
                              <img 
                                src={m.content} 
                                alt="Shared Image" 
                                style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', cursor: 'pointer' }}
                                onClick={() => window.open(m.content, '_blank')}
                              />
                            ) : m.type?.toLowerCase() === 'file' ? (
                              <a 
                                href={m.content} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isMe ? '#fff' : 'inherit', textDecoration: 'underline' }}
                              >
                                <span className="material-symbols-outlined">description</span>
                                {m.content.split('/').pop() || 'Tài liệu đính kèm'}
                              </a>
                            ) : (
                              m.content
                            )}
                          </div>
                          <div className="message-bubble__meta">
                            <span className="message-bubble__time">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              <span className="message-bubble__status">
                                {m.isRead ? (
                                  <span className="material-symbols-outlined read-icon">done_all</span>
                                ) : (
                                  <span className="material-symbols-outlined send-icon">done_all</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="chat-empty-feed">
                    <span className="material-symbols-outlined empty-feed-icon">forum</span>
                    <p>Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện!</p>
                  </div>
                )}


              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <div className="chat-main__footer">
            <div className="chat-input-container">
              <Input.TextArea
                ref={textareaRef}
                placeholder="Nhập nội dung tin nhắn... (Gõ @ để xem phím tắt)"
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                rows={1}
                autoSize={{ minRows: 1, maxRows: 3 }}
                className="chat-input-textarea"
                bordered={false}
              />
              <div className="chat-input-toolbar">
                <div className="chat-input-toolbar__left">
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
                    className="toolbar-btn" 
                    onClick={() => fileInputRef.current?.click()}
                  />
                  <Button 
                    type="text" 
                    icon={<span className="material-symbols-outlined">image</span>} 
                    className="toolbar-btn" 
                    onClick={() => imageInputRef.current?.click()}
                  />
                  
                  <Popover
                    content={emojiContent}
                    title="Chọn Emoji"
                    trigger="click"
                    open={emojiOpen}
                    onOpenChange={setEmojiOpen}
                    placement="top"
                  >
                    <Button 
                      type="text" 
                      icon={<span className="material-symbols-outlined">mood</span>} 
                      className="toolbar-btn" 
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
                    placement="top"
                  >
                    <Button 
                      type="text" 
                      icon={<span className="material-symbols-outlined">alternate_email</span>} 
                      className="toolbar-btn" 
                    />
                  </Popover>
                </div>
                <Button
                  type="primary"
                  className="chat-send-btn"
                  onClick={() => handleSendMessage()}
                >
                  <span>Gửi</span>
                  <span className="material-symbols-outlined send-btn-icon">send</span>
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="chat-main__empty">
          <span className="material-symbols-outlined main-empty-icon">chat</span>
          <h3>Hãy chọn một cuộc hội thoại</h3>
          <p>Chọn người dùng từ thanh bên trái để bắt đầu nhắn tin trao đổi.</p>
        </div>
      )}
    </div>
  )
}

export default ChatWindow
