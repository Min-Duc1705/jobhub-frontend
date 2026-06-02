import { Avatar, Button, Spin, Input } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { IConversationDto, IMessageDto } from '../../../services/chat-service'

interface ChatWindowProps {
  activeConversation: IConversationDto | null
  messages: IMessageDto[]
  profiles: Record<string, { name: string; avatar?: string }>
  currentUserId: string
  loadingMessages: boolean
  inputText: string
  setInputText: (text: string) => void
  handleSendMessage: () => void
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
                          <div className="message-bubble__text">{m.content}</div>
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
                  <Button type="text" icon={<span className="material-symbols-outlined">attach_file</span>} className="toolbar-btn" />
                  <Button type="text" icon={<span className="material-symbols-outlined">image</span>} className="toolbar-btn" />
                  <Button type="text" icon={<span className="material-symbols-outlined">mood</span>} className="toolbar-btn" />
                  <Button type="text" icon={<span className="material-symbols-outlined">alternate_email</span>} className="toolbar-btn" />
                </div>
                <Button
                  type="primary"
                  className="chat-send-btn"
                  onClick={handleSendMessage}
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
