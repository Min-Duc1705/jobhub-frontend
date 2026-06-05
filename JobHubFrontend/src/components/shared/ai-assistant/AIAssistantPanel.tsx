import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Input, Tooltip, Upload, message, Spin, Tag } from 'antd';
import { useAppSelector } from '../../../redux/hooks';
import {
  SendOutlined,
  PaperClipOutlined,
  DeleteOutlined,
  CloseOutlined,
  RobotOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  sendAssistantMessage,
  uploadFileToAssistant,
  confirmAssistantAction,
  clearAssistantSession,
} from '../../../services/ai-assistant-service';
import type { AssistantMessage, ActionItem } from '../../../types/assistant';
import { useNavigate } from 'react-router-dom';
import './AIAssistantPanel.scss';


const { TextArea } = Input;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: ActionItem[];
  pendingAction?: ActionItem;
  suggestions?: string[];
  isLoading?: boolean;
  error?: boolean;
}

interface AIAssistantPanelProps {
  onClose: () => void;
}

function getOrCreateSessionId(userId: string): string {
  const key = `ai_assistant_session_id_${userId}`;
  let sid = localStorage.getItem(key);
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(key, sid);
  }
  return sid;
}

// Simple markdown renderer
function renderMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code inline
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Code blocks
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Numbered list
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="numbered">$1</li>')
    // Bullet list
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr />')
    // Line breaks (chuyển \n thành <br />)
    .replace(/\n/g, '<br />')
    // Xóa <br /> giữa/trước/sau các <li> (gây ra khoảng trắng thừa)
    .replace(/<br \/>\s*(<li)/g, '$1')
    .replace(/(<\/li>)\s*<br \/>/g, '$1')
    // Wrap consecutive <li> in <ul>
    .replace(/((<li[^>]*>.*?<\/li>)+)/gs, '<ul>$1</ul>')
    // Dọn <br /> thừa sau block elements
    .replace(/<\/ul>\s*<br \/>/g, '</ul>')
    .replace(/<\/h[123]>\s*<br \/>/g, (m) => m.replace(/<br \/>/, ''))
    .replace(/<\/pre>\s*<br \/>/g, '</pre>');
}

function getDefaultWelcomeMessage(): ChatMessage[] {
  return [{
    id: 'welcome',
    role: 'assistant',
    content: '👋 Xin chào! Tôi là **JobHub AI Assistant** — trợ lý thông minh của bạn.\n\nTôi có thể giúp bạn:\n- 📋 Tạo tin tuyển dụng từ mô tả hoặc ảnh JD\n- 🔍 Tìm kiếm ứng viên và tin tuyển dụng\n- 📊 Xem thống kê và dự đoán lương thị trường\n- 💼 Quản lý hồ sơ ứng tuyển\n\nHãy hỏi tôi bất cứ điều gì!',
    timestamp: new Date(),
    suggestions: [
      'Tìm việc làm Backend Developer',
      'Dự đoán lương cho Senior React Developer',
      'Xem tin tuyển dụng đang mở',
    ]
  }];
}

export default function AIAssistantPanel({ onClose }: AIAssistantPanelProps) {
  const { user } = useAppSelector((state: any) => state.auth);
  const userId = user?.id || user?.email || 'guest';
  const sessionId = getOrCreateSessionId(userId);
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<AssistantMessage[]>([]);
  const [pendingFileData, setPendingFileData] = useState<{ imageBase64?: string; fileContent?: string; fileName?: string } | null>(null);
  // Multiple pasted images support
  const [pastedImages, setPastedImages] = useState<Array<{ dataUrl: string; base64: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileUploadRef = useRef<any>(null);

  // Load state when sessionId changes
  useEffect(() => {
    const saved = localStorage.getItem(`ai_messages_${sessionId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } catch (e) {
        setMessages(getDefaultWelcomeMessage());
      }
    } else {
      setMessages(getDefaultWelcomeMessage());
    }

    const savedHistory = localStorage.getItem(`ai_history_${sessionId}`);
    if (savedHistory) {
      try {
        setConversationHistory(JSON.parse(savedHistory));
      } catch (e) {
        setConversationHistory([]);
      }
    } else {
      setConversationHistory([]);
    }
    setPendingFileData(null);
    setPastedImages([]);
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Clipboard paste handler ─────────────────────────────────────────────────
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageItems = Array.from(items).filter(i => i.type.startsWith('image/'));
    if (imageItems.length === 0) return;
    e.preventDefault();
    imageItems.forEach(item => {
      const file = item.getAsFile();
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const base64 = dataUrl.split(',')[1];
        setPastedImages(prev => [...prev, { dataUrl, base64 }]);
        // Set pendingFileData to first image for API compatibility
        setPendingFileData(prev => prev ?? { imageBase64: base64, fileName: 'image' });
      };
      reader.readAsDataURL(file);
    });
    message.success(imageItems.length > 1 ? `Đã dán ${imageItems.length} ảnh!` : 'Đã dán ảnh từ clipboard!');
  }, []);


  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => {
      const next = [...prev, {
        ...msg,
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date(),
      }];
      localStorage.setItem(`ai_messages_${sessionId}`, JSON.stringify(next));
      return next;
    });
  }, [sessionId]);

  const sendMessage = async (textOverride?: string) => {
    const text = textOverride || inputValue.trim();
    if (!text && !pendingFileData) return;
    if (isLoading) return;

    const userContent = text;

    addMessage({
      role: 'user',
      content: userContent,
      ...(pastedImages.length > 0 ? { imagePreviews: pastedImages.map(i => i.dataUrl) } : {}),
    } as any);
    setInputValue('');
    setPastedImages([]);
    setIsLoading(true);

    // Add loading indicator
    const loadingId = `loading_${Date.now()}`;
    setMessages(prev => [...prev, {
      id: loadingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }]);

    const newHistory: AssistantMessage[] = [
      ...conversationHistory,
      { role: 'user', content: text }
    ];

    try {
      const response = await sendAssistantMessage(
        {
          message: text,
          image_base64: pendingFileData?.imageBase64,
          file_content: pendingFileData?.fileContent,
          conversation_history: newHistory.slice(-10), // last 10 for context
        },
        sessionId
      );

      setPendingFileData(null);
      setPastedImages([]);

      // Update conversation history
      const nextHistory = [
        ...newHistory,
        { role: 'model', content: response.reply }
      ];
      setConversationHistory(nextHistory);
      localStorage.setItem(`ai_history_${sessionId}`, JSON.stringify(nextHistory));

      // Replace loading message with response
      setMessages(prev => {
        const newMsgs = prev.filter(m => m.id !== loadingId);
        const next = [...newMsgs, {
          id: `ai_${Date.now()}`,
          role: 'assistant' as const,
          content: response.reply,
          timestamp: new Date(),
          actions: response.actions_taken,
          pendingAction: response.pending_action,
          suggestions: response.suggestions,
        }];
        localStorage.setItem(`ai_messages_${sessionId}`, JSON.stringify(next));
        return next;
      });

      // Xử lý chuyển hướng trang nếu AI gọi tool_navigate_to_page thành công
      if (response.actions_taken && response.actions_taken.length > 0) {
        const navAction = response.actions_taken.find(
          (act: any) => act.action_type === 'tool_navigate_to_page'
        );
        if (navAction && navAction.data) {
          const { status, path, message: navMessage } = navAction.data;
          if (status === 'success' && path) {
            message.success(navMessage || 'Đang chuyển hướng...');
            setTimeout(() => {
              let targetPath = path;
              const origin = window.location.origin;
              if (path.startsWith(origin)) {
                targetPath = path.substring(origin.length);
              } else if (path.startsWith('http://') || path.startsWith('https://')) {
                try {
                  const urlObj = new URL(path);
                  if (urlObj.host === window.location.host) {
                    targetPath = urlObj.pathname + urlObj.search + urlObj.hash;
                  } else {
                    window.location.href = path;
                    return;
                  }
                } catch (e) {
                  window.location.href = path;
                  return;
                }
              }
              navigate(targetPath);
            }, 800);
          } else if (status === 'unauthorized') {
            message.error(navAction.data.message || 'Bạn không có quyền truy cập trang này.');
          }
        }
      }

    } catch (err: any) {
      setMessages(prev => {
        const newMsgs = prev.filter(m => m.id !== loadingId);
        const next = [...newMsgs, {
          id: `err_${Date.now()}`,
          role: 'assistant' as const,
          content: 'Xin lỗi, đã xảy ra lỗi kết nối. Vui lòng thử lại.',
          timestamp: new Date(),
          error: true,
        }];
        localStorage.setItem(`ai_messages_${sessionId}`, JSON.stringify(next));
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async (pendingAction: ActionItem) => {
    try {
      setIsLoading(true);
      const result = await confirmAssistantAction(
        pendingAction.action_type,
        pendingAction.data,
        sessionId
      );

      if (result.statusCode === 200) {
        addMessage({
          role: 'assistant',
          content: `✅ **${result.message}**\n\nHành động đã được thực hiện thành công!`,
          suggestions: ['Xem tin tuyển dụng vừa tạo', 'Tạo thêm tin tuyển dụng khác'],
        });
        message.success(result.message || 'Thực hiện thành công!');
      } else {
        addMessage({
          role: 'assistant',
          content: `❌ Không thể thực hiện: ${result.message}`,
          error: true,
        });
      }
    } catch (err) {
      addMessage({
        role: 'assistant',
        content: '❌ Đã xảy ra lỗi khi thực hiện hành động. Vui lòng thử lại.',
        error: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAction = () => {
    addMessage({
      role: 'assistant',
      content: '↩️ Đã hủy hành động. Bạn có muốn thay đổi thông tin gì không?',
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      message.loading('Đang phân tích file...', 1.5);
      const result = await uploadFileToAssistant(file);
      const data = result.data;

      if (data.type === 'image') {
        setPendingFileData({
          imageBase64: data.image_base64,
          fileName: file.name,
        });

        // If image has extracted job data, pre-fill message
        if (data.extracted_data && Object.keys(data.extracted_data).length > 0) {
          const extracted = data.extracted_data;
          addMessage({
            role: 'system' as any,
            content: `📎 Đã tải ảnh **${file.name}** — AI đã phân tích và phát hiện thông tin tuyển dụng. Nhấn gửi để tạo preview job.`,
          });
          setInputValue(`Tạo job từ ảnh JD này: ${extracted.name || 'đã upload'}`);
        } else {
          addMessage({
            role: 'system' as any,
            content: `📎 Đã đính kèm ảnh **${file.name}**. Hãy mô tả bạn muốn làm gì với ảnh này.`,
          });
        }
      } else {
        setPendingFileData({
          fileContent: data.file_content,
          fileName: file.name,
        });
        addMessage({
          role: 'system' as any,
          content: `📎 Đã đính kèm file **${file.name}**. Hãy cho tôi biết bạn muốn làm gì với file này.`,
        });
      }

      message.success('Đã tải file thành công!');
    } catch (err) {
      message.error('Không thể tải file. Vui lòng thử lại.');
    }
    return false; // Prevent default ant upload
  };

  const handleClearSession = async () => {
    try {
      await clearAssistantSession(sessionId);
      const welcome = [{
        id: 'welcome_new',
        role: 'assistant',
        content: '🔄 Đã xóa lịch sử hội thoại. Tôi có thể giúp gì cho bạn?',
        timestamp: new Date(),
      }];
      setMessages(welcome);
      localStorage.setItem(`ai_messages_${sessionId}`, JSON.stringify(welcome));
      setConversationHistory([]);
      localStorage.setItem(`ai_history_${sessionId}`, JSON.stringify([]));
      setPendingFileData(null);
    } catch (err) {
      message.error('Không thể xóa lịch sử');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.isLoading) {
      return (
        <div className="ai-typing-indicator">
          <span></span><span></span><span></span>
        </div>
      );
    }
    return (
      <div
        className="ai-message-content"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
      />
    );
  };

  return (
    <div className="ai-assistant-panel">
      {/* Header – giống chat-main__header */}
      <div className="ai-panel-header">
        <div className="ai-panel-header-left">
          <div className="ai-avatar-glow">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>smart_toy</span>
          </div>
          <div className="ai-panel-title">
            <span className="ai-name">JobHub AI</span>
            <span className="ai-status">Online</span>
          </div>
        </div>
        <div className="ai-panel-header-actions">
          <Tooltip title="Xóa hội thoại">
            <Button
              type="text"
              icon={<span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_sweep</span>}
              onClick={handleClearSession}
              className="ai-header-btn"
            />
          </Tooltip>
          <Tooltip title="Đóng">
            <Button
              type="text"
              icon={<span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>}
              onClick={onClose}
              className="ai-header-btn"
            />
          </Tooltip>
        </div>
      </div>

      {/* Messages */}
      <div className="ai-messages-container">
        {messages.map(msg => (
          <div key={msg.id} className={`ai-message ai-message--${msg.role}`}>
            {/* Avatar luôn đứng trước bubble trong DOM.
                - Bot (không reverse): bot-avatar (trái) | bubble (phải) ✓
                - User (row-reverse):  user-avatar → rightmost = phải, bubble → trái ✓ */}
            {msg.role !== 'user' && (
              <div className="ai-bot-avatar">
                <span className="material-symbols-outlined">smart_toy</span>
              </div>
            )}
            {msg.role === 'user' && (
              <div className="ai-user-avatar">
                <span className="material-symbols-outlined">person</span>
              </div>
            )}
            <div className="ai-message-bubble">
              {renderMessageContent(msg)}

              {/* Pending Action Preview Card */}
              {msg.pendingAction && (
                <div className="ai-action-preview-card">
                  <div className="ai-action-preview-header">
                    <span>📋 Xem trước hành động</span>
                    <Tag color="orange">Cần xác nhận</Tag>
                  </div>
                  <div className="ai-action-preview-body">
                    <strong>{msg.pendingAction.description}</strong>
                    {msg.pendingAction.data && (
                      <div className="ai-action-data">
                        {Object.entries(msg.pendingAction.data).map(([k, v]) =>
                          v ? (
                            <div key={k} className="ai-action-field">
                              <span className="ai-field-key">{k}:</span>
                              <span className="ai-field-val">{String(v)}</span>
                            </div>
                          ) : null
                        )}
                      </div>
                    )}
                  </div>
                  <div className="ai-action-preview-actions">
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleConfirmAction(msg.pendingAction!)}
                      loading={isLoading}
                      className="ai-confirm-btn"
                    >
                      {msg.pendingAction.action_type === 'delete_job' ? 'Xác nhận xóa' : 'Xác nhận tạo'}
                    </Button>
                    <Button
                      size="small"
                      icon={<CloseCircleOutlined />}
                      onClick={handleCancelAction}
                      className="ai-cancel-btn"
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="ai-suggestions">
                  {msg.suggestions.map((s, i) => (
                    <button
                      key={i}
                      className="ai-suggestion-chip"
                      onClick={() => sendMessage(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div className="ai-message-meta">
                {msg.error && (
                  <Button
                    type="link"
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() => sendMessage(conversationHistory[conversationHistory.length - 2]?.content)}
                    className="ai-retry-btn"
                  >
                    Thử lại
                  </Button>
                )}
                <span className="ai-message-time">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Pasted images preview strip */}
      {pastedImages.length > 0 && (
        <div className="ai-pending-file ai-pending-images-strip">
          {pastedImages.map((img, idx) => (
            <div key={idx} className="ai-thumb-wrap">
              <img src={img.dataUrl} alt={`img-${idx}`} className="ai-thumb" />
              <button
                className="ai-thumb-remove"
                onClick={() => {
                  setPastedImages(prev => {
                    const next = prev.filter((_, i) => i !== idx);
                    if (next.length === 0) setPendingFileData(null);
                    else setPendingFileData({ imageBase64: next[0].base64, fileName: 'image' });
                    return next;
                  });
                }}
              >✕</button>
            </div>
          ))}
        </div>
      )}
      {/* Non-image pending file */}
      {pendingFileData && pastedImages.length === 0 && (
        <div className="ai-pending-file">
          <PaperClipOutlined />
          <span>{pendingFileData.fileName}</span>
          <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setPendingFileData(null)} />
        </div>
      )}

      {/* Input Area – giống chat-main__footer */}
      <div className="ai-input-area">
        <div className="ai-input-container">
          <TextArea
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={(e) => {
              const items = e.nativeEvent.clipboardData?.items;
              if (!items) return;
              const hasImage = Array.from(items).some(i => i.type.startsWith('image/'));
              if (hasImage) {
                e.preventDefault();
                handlePaste(e.nativeEvent as ClipboardEvent);
              }
            }}
            placeholder="Nhập nội dung tin nhắn... (Gõ @ để xem phím tắt)"
            autoSize={{ minRows: 1, maxRows: 6 }}
            className="ai-input-field"
            disabled={isLoading}
            bordered={false}
          />
          <div className="ai-input-toolbar-row">
            <div className="ai-toolbar-left">
              <Upload
                ref={fileUploadRef}
                beforeUpload={handleFileUpload}
                showUploadList={false}
                accept="image/*,.pdf,.txt,.doc,.docx"
              >
                <Tooltip title="Đính kèm file hoặc ảnh JD">
                  <Button
                    type="text"
                    icon={<span className="material-symbols-outlined">attach_file</span>}
                    className="ai-toolbar-btn"
                  />
                </Tooltip>
              </Upload>
            </div>
            <Button
              type="primary"
              onClick={() => sendMessage()}
              disabled={(!inputValue.trim() && !pendingFileData) || isLoading}
              className="ai-send-btn"
            >
              {isLoading
                ? <Spin size="small" />
                : <><span>Gửi</span><span className="material-symbols-outlined ai-send-icon">send</span></>
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
