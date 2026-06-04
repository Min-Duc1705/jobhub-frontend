import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { notification } from 'antd'
import { useAppSelector } from '../../../redux/hooks'
import { useChatHub, useChatHubEvent } from '../../../hooks/useChatHub'
import {
  getConversationsApi,
  getChatHistoryApi,
  sendChatMessageApi,
  getOrCreateConversationApi,
  type IConversationDto,
  type IMessageDto
} from '../../../services/chat-service'
import { getCustomerByIdApi } from '../../../services/customer-service'
import ChatSidebar from '../../../components/shared/chat/ChatSidebar'
import ChatWindow from '../../../components/shared/chat/ChatWindow'
import './ChatPage.scss'

const ChatPage = () => {
  const { user } = useAppSelector((state) => state.auth)
  const currentUserId = user?.id || ''

  const [searchParams] = useSearchParams()
  const chatWithUserId = searchParams.get('userId')

  // Scroll window to top on mount to avoid carrying over scroll position from previous page
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [conversations, setConversations] = useState<IConversationDto[]>([])
  const [activeConversation, setActiveConversation] = useState<IConversationDto | null>(null)
  const [messages, setMessages] = useState<IMessageDto[]>([])
  const [inputText, setInputText] = useState('')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Profiles cache (to resolve Guid IDs to names and avatars)
  const [profiles, setProfiles] = useState<Record<string, { name: string; avatar?: string }>>({})

  // SignalR — dùng singleton connection (không tạo connection riêng)
  const { connection } = useChatHub(currentUserId || null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)

  // Use refs to avoid reconnecting to SignalR Hub when activeConversation changes
  const activeConversationRef = useRef<IConversationDto | null>(null)
  useEffect(() => {
    activeConversationRef.current = activeConversation
  }, [activeConversation])

  // 1. Fetch conversations
  const fetchConversations = async () => {
    try {
      setLoadingConvs(true)
      const res = await getConversationsApi()
      if (res && res.data) {
        let list = res.data

        // Nếu có query param chatWithUserId, hãy lấy hoặc tạo hội thoại trước để tránh race condition
        if (chatWithUserId) {
          try {
            const directRes = await getOrCreateConversationApi(chatWithUserId)
            if (directRes && directRes.data) {
              const conv = directRes.data
              // Nếu chưa có trong danh sách thì chèn vào đầu
              if (!list.some(c => c.id === conv.id)) {
                list = [conv, ...list]
              }
              // Set làm active conversation
              setActiveConversation(conv)
              
              // Fetch profile của người kia
              const otherId = conv.participantA.toLowerCase() === currentUserId.toLowerCase()
                ? conv.participantB
                : conv.participantA
              fetchUserProfile(otherId)
            }
          } catch (directErr) {
            console.error('Error fetching/creating direct chat:', directErr)
          }
        }

        setConversations(list)
        
        // Fetch profiles for participants
        list.forEach((c) => {
          const otherId = c.participantA.toLowerCase() === currentUserId.toLowerCase()
            ? c.participantB
            : c.participantA
          if (!profiles[otherId]) {
            fetchUserProfile(otherId)
          }
        })
      }
    } catch (err) {
      console.error('Error fetching conversations:', err)
    } finally {
      setLoadingConvs(false)
    }
  }

  // Fetch a user profile and cache it
  const fetchUserProfile = async (userId: string) => {
    try {
      const res = await getCustomerByIdApi(userId)
      if (res && res.data) {
        setProfiles((prev) => ({
          ...prev,
          [userId]: {
            name: res.data.fullName || 'Người dùng',
            avatar: res.data.avatar || undefined
          }
        }))
        return
      }
    } catch (e) {
      // HR/Employer or Admin profile fetch fails or does not have Customer model
    }
    // Fallback
    setProfiles((prev) => ({
      ...prev,
      [userId]: {
        name: `Nhà tuyển dụng / Đối tác`,
        avatar: undefined
      }
    }))
  }

  useEffect(() => {
    if (currentUserId) {
      fetchConversations()
    }
  }, [currentUserId, chatWithUserId])

  // 2. Fetch Chat History when active conversation changes
  useEffect(() => {
    if (!activeConversation) {
      setMessages([])
      return
    }

    const fetchHistory = async () => {
      try {
        setLoadingMessages(true)
        const res = await getChatHistoryApi(activeConversation.id, 50)
        if (res && res.data) {
          setMessages(res.data)
          scrollToBottom()
        }
      } catch (err) {
        console.error('Error fetching chat history:', err)
      } finally {
        setLoadingMessages(false)
      }
    }

    fetchHistory()

    // Mark as read in DB/Hub
    if (connection && activeConversation.unreadCount > 0) {
      const otherId = activeConversation.participantA.toLowerCase() === currentUserId.toLowerCase()
        ? activeConversation.participantB
        : activeConversation.participantA

      connection.invoke('MarkConversationAsRead', activeConversation.id, otherId)
        .then(() => {
          setConversations(prev => prev.map(c => 
            c.id === activeConversation.id ? { ...c, unreadCount: 0 } : c
          ))
        })
        .catch(err => console.error('Mark read hub error:', err))
    }
  }, [activeConversation, connection])

  // 3. Lắng nghe ReceiveMessage từ singleton connection
  useChatHubEvent(connection, 'ReceiveMessage', (msg: IMessageDto) => {
    const activeConv = activeConversationRef.current
    if (activeConv && msg.conversationId === activeConv.id) {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      scrollToBottom()
      if (msg.senderId.toLowerCase() !== currentUserId.toLowerCase()) {
        connection?.invoke('MarkConversationAsRead', activeConv.id, msg.senderId)
          .catch(err => console.error('Auto mark read error:', err))
      }
    }
    setConversations(prev => {
      const index = prev.findIndex(c => c.id === msg.conversationId)
      if (index !== -1) {
        const updated = [...prev]
        const isCurrentActive = activeConversationRef.current?.id === msg.conversationId
        updated[index] = {
          ...updated[index],
          lastMessageContent: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: isCurrentActive || msg.senderId.toLowerCase() === currentUserId.toLowerCase()
            ? 0
            : updated[index].unreadCount + 1
        }
        return updated.sort((a, b) => {
          const dateA = new Date(a.lastMessageAt || a.createdAt).getTime()
          const dateB = new Date(b.lastMessageAt || b.createdAt).getTime()
          return dateB - dateA
        })
      } else {
        fetchConversations()
        return prev
      }
    })
  })

  // 3b. Lắng nghe ConversationRead từ singleton connection
  useChatHubEvent(connection, 'ConversationRead', (data: { conversationId: string; readerId: string }) => {
    const activeConv = activeConversationRef.current
    if (activeConv && activeConv.id === data.conversationId) {
      setMessages(prev => prev.map(m =>
        m.senderId.toLowerCase() === currentUserId.toLowerCase() ? { ...m, isRead: true } : m
      ))
    }
  })

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }
    }, 50)
  }

  // 4. Send message handler
  const handleSendMessage = async (customContent?: string, customType?: string) => {
    const textToSend = customContent !== undefined ? customContent : inputText.trim()
    const messageType = customType !== undefined ? customType : 'text'

    if (!textToSend || !activeConversation) return

    const receiverId = activeConversation.participantA.toLowerCase() === currentUserId.toLowerCase()
      ? activeConversation.participantB
      : activeConversation.participantA

    try {
      if (connection) {
        await connection.invoke('SendPrivateMessage', receiverId, textToSend, messageType)
      } else {
        const res = await sendChatMessageApi(receiverId, textToSend, messageType)
        if (res && res.data) {
          setMessages(prev => [...prev, res.data])
          scrollToBottom()
        }
      }
      if (customContent === undefined) {
        setInputText('')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      notification.error({ message: 'Lỗi gửi tin nhắn', description: 'Vui lòng kiểm tra lại kết nối.' })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-layout">
        
        {/* LEFT PANEL: Conversations list */}
        <ChatSidebar
          conversations={conversations}
          activeConversation={activeConversation}
          setActiveConversation={setActiveConversation}
          profiles={profiles}
          currentUserId={currentUserId}
          loadingConvs={loadingConvs}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* RIGHT PANEL: Chat messages & inputs */}
        <ChatWindow
          activeConversation={activeConversation}
          messages={messages}
          profiles={profiles}
          currentUserId={currentUserId}
          loadingMessages={loadingMessages}
          inputText={inputText}
          setInputText={setInputText}
          handleSendMessage={handleSendMessage}
          handleKeyPress={handleKeyPress}
          messagesEndRef={messagesEndRef}
          messagesContainerRef={messagesContainerRef}
        />

      </div>
    </div>
  )
}

export default ChatPage
