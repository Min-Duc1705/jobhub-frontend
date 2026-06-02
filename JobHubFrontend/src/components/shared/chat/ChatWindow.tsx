import { useRef } from 'react'
import { Avatar, Button, Spin, Input, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { IConversationDto, IMessageDto } from '../../../services/chat-service'
import { uploadCompanyPublicImageApi } from '../../../services/company-service'
import { uploadResumeFileApi } from '../../../services/resume-service'

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
        await handleSendMessage(res.data.url, 'file')
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
              <Button type="text" icon={<span className="material-symbols-outlined">call</span>} className="chat-header-btn" />
              <Button type="text" icon={<span className="material-symbols-outlined">videocam</span>} className="chat-header-btn" />
              <Button type="text" icon={<span className="material-symbols-outlined">remove</span>} className="chat-header-btn" onClick={handleMinimize} />
              <Button type="text" icon={<span className="material-symbols-outlined">info</span>} className="chat-header-btn" />
              <Button type="text" icon={<span className="material-symbols-outlined">more_vert</span>} className="chat-header-btn" />
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
                placeholder="Nhập nội dung tin nhắn..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
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
                  <Button type="text" icon={<span className="material-symbols-outlined">mood</span>} className="toolbar-btn" />
                  <Button type="text" icon={<span className="material-symbols-outlined">alternate_email</span>} className="toolbar-btn" />
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
