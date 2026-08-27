'use client';

import { useEffect, useRef, useState } from 'react';
import { Brain, MessageCircle, Send, Sparkles, Square, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type ChatRole = 'assistant' | 'user';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  streaming?: boolean;
}

interface FloatingConceptChatProps {
  studentName: string;
  grade?: string;
  language?: 'english' | 'kiswahili' | 'mixed';
  /** Optional activity subject so questions get the right learning context. */
  subject?: string;
}

const SUGGESTED_QUESTIONS = [
  'Help me understand fractions',
  'What is photosynthesis?',
  'How do I write a good paragraph?',
];

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function welcomeMessage(studentName: string, subject: string): ChatMessage {
  const topicPrompt =
    subject === 'Concept help'
      ? 'What concept would you like to understand today?'
      : `What would you like to understand about ${subject}?`;

  return {
    id: 'welcome',
    role: 'assistant',
    content: `Karibu${studentName && studentName !== 'Student' ? `, ${studentName}` : ''}! ${topicPrompt}`,
  };
}

/**
 * A lightweight, dashboard-wide way to ask syncsenta about a concept without
 * interrupting the student's selected learning activity.
 */
export function FloatingConceptChat({
  studentName,
  grade = 'Grade 4',
  language = 'mixed',
  subject = 'Concept help',
}: FloatingConceptChatProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [welcomeMessage(studentName, subject)]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages((current) =>
      current.length === 1 && current[0]?.id === 'welcome'
        ? [welcomeMessage(studentName, subject)]
        : current,
    );
  }, [studentName, subject]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const closePanel = () => {
    abortRef.current?.abort();
    setBusy(false);
    setOpen(false);
  };

  const sendMessage = async (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!message || busy) return;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: 'user',
      content: message,
    };
    const assistantId = makeId();
    const priorTurns = messages
      .filter((item) => item.id !== 'welcome' && item.content.trim())
      .map(({ role, content }) => ({ role, content }));

    setMessages((current) => [
      ...current.filter((item) => item.id !== 'welcome'),
      userMessage,
      { id: assistantId, role: 'assistant', content: '', streaming: true },
    ]);
    setInput('');
    setError(null);
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message,
          history: priorTurns,
          grade,
          subject,
          language,
          studentName,
          mode: 'socratic',
        }),
      });

      if (!response.ok || !response.body) {
        let detail = `syncsenta could not answer right now (${response.status}).`;
        try {
          const body = await response.json();
          detail = body.detail || body.error || detail;
        } catch {
          // Keep the useful HTTP fallback message.
        }
        throw new Error(detail);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let separator = buffer.indexOf('\n\n');
        while (separator !== -1) {
          const frame = buffer.slice(0, separator).trim();
          buffer = buffer.slice(separator + 2);
          separator = buffer.indexOf('\n\n');

          if (!frame.startsWith('data:')) continue;
          const payload = frame.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;

          const event = JSON.parse(payload) as { delta?: string; error?: string; detail?: string };
          if (event.error) throw new Error(event.detail || event.error);
          if (!event.delta) continue;

          answer += event.delta;
          setMessages((current) =>
            current.map((item) =>
              item.id === assistantId ? { ...item, content: answer } : item,
            ),
          );
        }
      }

      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? { ...item, content: answer || 'I need a moment—please try that question again.', streaming: false }
            : item,
        ),
      );
    } catch (caught) {
      if (controller.signal.aborted) {
        setMessages((current) => current.filter((item) => item.id !== assistantId));
      } else {
        const detail = caught instanceof Error ? caught.message : 'Connection failed.';
        setError(detail);
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantId
              ? { ...item, content: 'I could not connect just now. Please try again in a moment.', streaming: false }
              : item,
          ),
        );
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="fixed bottom-32 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-32">
      {open && (
        <section
          id="mwalimu-concept-chat"
          aria-label="Ask syncsenta about a concept"
          className="flex h-[min(39rem,calc(100vh-14rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border bg-background shadow-2xl sm:h-[min(39rem,calc(100vh-7rem))] sm:w-[25rem]"
        >
          <header className="flex items-center gap-3 border-b bg-primary px-4 py-3 text-primary-foreground">
            <Avatar className="h-10 w-10 border border-primary-foreground/30 bg-primary-foreground/10">
              <AvatarFallback className="bg-primary-foreground/15 text-primary-foreground">
                <Brain className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">syncsenta</p>
              <p className="text-xs text-primary-foreground/80">
                {subject === 'Concept help' ? 'Concept help · Ask anything' : `${subject} · Concept help`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
              onClick={closePanel}
              aria-label="Close syncsenta chat"
            >
              <X className="h-5 w-5" />
            </Button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-3">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-2 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {item.role === 'assistant' && (
                    <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Brain className="h-3.5 w-3.5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      item.role === 'user'
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md bg-muted text-foreground'
                    }`}
                  >
                    {item.content}
                    {item.streaming && (
                      <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse rounded bg-current align-middle" />
                    )}
                  </div>
                </div>
              ))}

              {messages.length === 1 && (
                <div className="pt-1">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Try a question</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((question) => (
                      <Button
                        key={question}
                        variant="outline"
                        size="sm"
                        className="h-auto whitespace-normal rounded-full px-3 py-1.5 text-left text-xs"
                        onClick={() => sendMessage(question)}
                        disabled={busy}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <p role="alert" className="border-t bg-destructive/10 px-4 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <form
            className="border-t bg-background p-3"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(input);
            }}
          >
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about a concept…"
                rows={2}
                disabled={busy}
                className="min-h-10 resize-none rounded-xl"
                aria-label="Question for syncsenta"
              />
              {busy ? (
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={() => abortRef.current?.abort()}
                  aria-label="Stop syncsenta's response"
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim()}
                  aria-label="Send question to syncsenta"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </section>
      )}

      <Button
        className="h-14 rounded-full px-5 shadow-lg shadow-primary/30"
        onClick={() => (open ? closePanel() : setOpen(true))}
        aria-expanded={open}
        aria-controls="mwalimu-concept-chat"
      >
        {open ? <X className="mr-2 h-5 w-5" /> : <MessageCircle className="mr-2 h-5 w-5" />}
        {open ? 'Close chat' : 'Ask syncsenta'}
        {!open && <Sparkles className="ml-2 h-4 w-4" />}
      </Button>
    </div>
  );
}
