import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import AIAssistantPanel from './AIAssistantPanel';
import './FloatingAIButton.scss';

export default function FloatingAIButton() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Track whether FloatingChatWidget is currently active
  const [chatActive, setChatActive] = useState(() =>
    !!localStorage.getItem('floating_chat')
  );

  // Listen for chat widget open/close events
  useEffect(() => {
    const syncChatState = () => {
      setChatActive(!!localStorage.getItem('floating_chat'));
    };
    window.addEventListener('floating_chat_changed', syncChatState);
    window.addEventListener('storage', syncChatState);
    return () => {
      window.removeEventListener('floating_chat_changed', syncChatState);
      window.removeEventListener('storage', syncChatState);
    };
  }, []);

  // Show tooltip once after 3 seconds
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 4000);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  // When chat bubble is visible (56px) + 24px margin + 8px gap = 88px
  const bottomOffset = chatActive ? 100 : 28;

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <div
          className="ai-floating-btn"
          style={{ bottom: bottomOffset }}
          onClick={() => setIsOpen(true)}
          role="button"
          aria-label="Mở AI Assistant"
          id="ai-assistant-floating-btn"
        >
          {showTooltip && (
            <div className="ai-floating-tooltip">
              Nhờ AI trợ giúp! ✨
            </div>
          )}
          <div className="ai-floating-btn-inner">
            🤖
          </div>
          <div className="ai-floating-pulse" />
        </div>
      )}

      {/* Panel floating window */}
      {isOpen && (
        <div
          className="ai-panel-container"
          id="ai-assistant-panel-container"
        >
          <AIAssistantPanel onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
}
