import { Avatar, Input, Spin, Empty } from 'antd'
import type { IConversationDto } from '../../../services/chat-service'

interface ChatSidebarProps {
  conversations: IConversationDto[]
  activeConversation: IConversationDto | null
  setActiveConversation: (conv: IConversationDto) => void
  profiles: Record<string, { name: string; avatar?: string }>
  currentUserId: string
  loadingConvs: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const ChatSidebar = ({
  conversations,
  activeConversation,
  setActiveConversation,
  profiles,
  currentUserId,
  loadingConvs,
  searchQuery,
  setSearchQuery
}: ChatSidebarProps) => {
  
  // Filter conversations based on query
  const filteredConversations = conversations.filter(c => {
    const otherId = c.participantA.toLowerCase() === currentUserId.toLowerCase()
      ? c.participantB
      : c.participantA
    const profile = profiles[otherId]
    if (!profile) return true
    return profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="chat-sidebar">
      <div className="chat-sidebar__header">
        <h3 className="chat-sidebar__title">Tin nhắn</h3>
        <div className="chat-sidebar__search-wrap">
          <Input
            placeholder="Tìm kiếm hội thoại..."
            prefix={<span className="material-symbols-outlined search-icon">search</span>}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="chat-search"
          />
        </div>
      </div>

      <div className="chat-sidebar__list custom-scrollbar">
        {loadingConvs ? (
          <div className="chat-spin-wrap">
            <Spin size="large" />
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((c) => {
            const otherId = c.participantA.toLowerCase() === currentUserId.toLowerCase()
              ? c.participantB
              : c.participantA
            const profile = profiles[otherId] || { name: 'Người dùng', avatar: undefined }
            const isActive = activeConversation?.id === c.id
            const isUnread = c.unreadCount > 0

            return (
              <div
                key={c.id}
                onClick={() => setActiveConversation(c)}
                className={`chat-item ${isActive ? 'chat-item--active' : ''} ${isUnread ? 'chat-item--unread' : ''}`}
              >
                <div className="chat-item__avatar-container">
                  <Avatar 
                    shape="square"
                    size={48} 
                    src={profile.avatar} 
                    className="chat-item__avatar"
                  >
                    {profile.name[0]?.toUpperCase()}
                  </Avatar>
                  {/* Status indicator: Giả lập online cho recruiter/đối tác */}
                  <span className="chat-item__status-dot chat-item__status-dot--online"></span>
                </div>

                <div className="chat-item__body">
                  <div className="chat-item__row">
                    <span className="chat-item__name">{profile.name}</span>
                    {c.lastMessageAt && (
                      <span className="chat-item__time">
                        {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="chat-item__row">
                    <span className="chat-item__msg">
                      {c.lastMessageContent || 'Bắt đầu cuộc trò chuyện mới'}
                    </span>
                    {isUnread && (
                      <span className="chat-item__badge">{c.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="chat-empty-sidebar">
            <Empty description="Không có cuộc hội thoại nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatSidebar
