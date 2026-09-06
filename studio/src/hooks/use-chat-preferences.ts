/**
 * Chat Preferences Hook
 * 
 * Manages chat-related user preferences (language, mode) with localStorage persistence.
 * Eliminates duplicated localStorage logic across chat components.
 */

'use client';

import { useEffect, useState } from 'react';

export type ChatLanguage = 'english' | 'kiswahili' | 'mixed';
export type ChatMode = 'socratic' | 'homework-help' | 'compass';

const LANGUAGE_KEY = 'preferredLanguage';
const MODE_KEY = 'chatMode.preferred';

interface ChatPreferences {
  language: ChatLanguage;
  chatMode: ChatMode;
  setLanguage: (language: ChatLanguage) => void;
  setChatMode: (mode: ChatMode) => void;
}

/**
 * Hook for managing chat preferences with localStorage persistence.
 * 
 * @returns Chat preferences and setters that automatically persist to localStorage
 * 
 * @example
 * ```tsx
 * function ChatPage() {
 *   const { language, chatMode, setLanguage, setChatMode } = useChatPreferences();
 *   
 *   return (
 *     <div>
 *       <LanguageSelector value={language} onChange={setLanguage} />
 *       <ChatModeSelector value={chatMode} onChange={setChatMode} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useChatPreferences(): ChatPreferences {
  const [language, setLanguageState] = useState<ChatLanguage>('english');
  const [chatMode, setChatModeState] = useState<ChatMode>('socratic');

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load language preference
    const savedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
    if (isValidLanguage(savedLanguage)) {
      setLanguageState(savedLanguage);
    }

    // Load chat mode preference
    const savedMode = window.localStorage.getItem(MODE_KEY);
    if (isValidChatMode(savedMode)) {
      setChatModeState(savedMode);
    }
  }, []);

  // Setter that persists to localStorage
  const setLanguage = (newLanguage: ChatLanguage) => {
    setLanguageState(newLanguage);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_KEY, newLanguage);
    }
  };

  // Setter that persists to localStorage
  const setChatMode = (newMode: ChatMode) => {
    setChatModeState(newMode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MODE_KEY, newMode);
    }
  };

  return {
    language,
    chatMode,
    setLanguage,
    setChatMode,
  };
}

// Type guards
function isValidLanguage(value: string | null): value is ChatLanguage {
  return value === 'english' || value === 'kiswahili' || value === 'mixed';
}

function isValidChatMode(value: string | null): value is ChatMode {
  return value === 'socratic' || value === 'homework-help' || value === 'compass';
}
