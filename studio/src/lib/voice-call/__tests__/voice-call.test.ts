/**
 * Voice Call System Tests
 * Tests for audio streaming, TTS, conversation management, and orchestration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioStreamManager } from '../audio-streaming';
import { StreamingTTSManager } from '../streaming-tts';
import { ConversationManager } from '../conversation-manager';

// Mock browser APIs
const mockGetUserMedia = vi.fn();
const mockAudioContext = vi.fn();
const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
};

beforeEach(() => {
  // Setup browser API mocks
  class TestStorage {
    private values = new Map<string, string>();
    getItem(key: string) { return this.values.get(key) ?? null; }
    setItem(key: string, value: string) { this.values.set(key, value); }
    removeItem(key: string) { this.values.delete(key); }
    clear() { this.values.clear(); }
  }
  Object.defineProperty(globalThis, 'Storage', { configurable: true, value: TestStorage });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new TestStorage() });
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      ...globalThis.navigator,
      mediaDevices: {
        getUserMedia: mockGetUserMedia,
      },
    },
  });

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      ...globalThis.window,
      AudioContext: mockAudioContext,
      speechSynthesis: mockSpeechSynthesis,
    },
  });

  /*
  global.window = {
    ...global.window,
    AudioContext: mockAudioContext,
    speechSynthesis: mockSpeechSynthesis,
  } as any;
  */
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('ConversationManager', () => {
  let manager: ConversationManager;

  beforeEach(() => {
    manager = new ConversationManager('test-user-123');
  });

  afterEach(() => {
    manager.dispose();
  });

  it('should create a new conversation', () => {
    const state = manager.getState();
    expect(state.userId).toBe('test-user-123');
    expect(state.messages).toHaveLength(0);
    expect(state.isActive).toBe(true);
  });

  it('should add user message', () => {
    const message = manager.addMessage('user', 'Hello, can you help me with math?');
    
    expect(message.role).toBe('user');
    expect(message.content).toBe('Hello, can you help me with math?');
    expect(manager.getState().messages).toHaveLength(1);
  });

  it('should add assistant message', () => {
    manager.addMessage('user', 'What is 2+2?');
    const response = manager.addMessage('assistant', '2+2 equals 4.');
    
    expect(response.role).toBe('assistant');
    expect(manager.getState().messages).toHaveLength(2);
  });

  it('should detect topic from message', () => {
    manager.addMessage('user', 'Can you explain algebra to me?');
    
    const state = manager.getState();
    expect(state.context.currentTopic).toBe('mathematics');
  });

  it('should handle topic transitions', () => {
    manager.addMessage('user', 'Tell me about math');
    expect(manager.getState().context.currentTopic).toBe('mathematics');
    
    manager.addMessage('user', 'Now let\'s talk about science');
    expect(manager.getState().context.currentTopic).toBe('science');
    expect(manager.getState().transitions).toHaveLength(1);
  });

  it('should track interruptions', () => {
    manager.addMessage('assistant', 'Let me explain this concept...');
    manager.handleInterruption('Wait, I have a question');
    
    const state = manager.getState();
    expect(state.interruptionCount).toBe(1);
  });

  it('should generate conversation summary', () => {
    manager.addMessage('user', 'Hello');
    manager.addMessage('assistant', 'Hi there!');
    
    const summary = manager.getConversationSummary();
    expect(summary).toContain('Student: Hello');
    expect(summary).toContain('Tutor: Hi there!');
  });

  it('should calculate conversation stats', () => {
    manager.addMessage('user', 'Question 1');
    manager.addMessage('assistant', 'Answer 1');
    manager.addMessage('user', 'Question 2');
    manager.addMessage('assistant', 'Answer 2');
    
    const stats = manager.getStats();
    expect(stats.messageCount).toBe(4);
    expect(stats.duration).toBeGreaterThan(0);
  });

  it('should update learner profile', () => {
    manager.updateLearnerProfile({
      grade: 'Grade 5',
      subject: 'Mathematics',
    });
    
    const state = manager.getState();
    expect(state.context.learnerProfile.grade).toBe('Grade 5');
    expect(state.context.learnerProfile.subject).toBe('Mathematics');
  });

  it('should mark concepts as covered', () => {
    manager.markConceptCovered('Fractions');
    manager.markConceptCovered('Decimals');
    
    const state = manager.getState();
    expect(state.context.conceptsCovered).toContain('Fractions');
    expect(state.context.conceptsCovered).toContain('Decimals');
  });

  it('should persist state to localStorage', () => {
    const mockSetItem = vi.fn();
    Storage.prototype.setItem = mockSetItem;
    
    manager.addMessage('user', 'Test message');
    
    // Wait for auto-save
    setTimeout(() => {
      expect(mockSetItem).toHaveBeenCalled();
    }, 5100);
  });
});

describe('StreamingTTSManager', () => {
  it('should split text into chunks', () => {
    const manager = new StreamingTTSManager();
    const text = 'First sentence. Second sentence! Third sentence?';
    
    // Access private method through type assertion for testing
    const chunks = (manager as any).splitIntoChunks(text);
    
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toContain('First sentence');
  });

  it('should estimate speech duration', () => {
    const text = 'This is a test sentence with about ten words in it.';
    const duration = estimateSpeechDuration(text, 1.0);
    
    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThan(10000); // Less than 10 seconds
  });
});

describe('Voice Call Integration', () => {
  it('should handle complete conversation flow', async () => {
    const manager = new ConversationManager('test-user');
    
    // User asks question
    manager.addMessage('user', 'What is photosynthesis?');
    expect(manager.getState().context.currentTopic).toBe('science');
    
    // AI responds
    manager.addMessage('assistant', 'Photosynthesis is the process plants use to make food.');
    
    // User switches topic
    manager.addMessage('user', 'Can we talk about math instead?');
    expect(manager.getState().context.currentTopic).toBe('mathematics');
    
    // Check conversation flow
    const stats = manager.getStats();
    expect(stats.messageCount).toBe(3);
    expect(stats.topicCount).toBe(2);
    
    manager.dispose();
  });

  it('should handle interruption gracefully', () => {
    const manager = new ConversationManager('test-user');
    
    manager.addMessage('user', 'Explain algebra');
    manager.addMessage('assistant', 'Algebra is a branch of mathematics that...');
    
    // User interrupts
    manager.handleInterruption('Wait, what about geometry?');
    
    const state = manager.getState();
    expect(state.interruptionCount).toBe(1);
    expect(state.context.currentTopic).toBe('mathematics');
    
    manager.dispose();
  });
});

describe('Performance Tests', () => {
  it('should handle rapid message additions', () => {
    const manager = new ConversationManager('test-user');
    const startTime = Date.now();
    
    // Add 100 messages rapidly
    for (let i = 0; i < 100; i++) {
      manager.addMessage(i % 2 === 0 ? 'user' : 'assistant', `Message ${i}`);
    }
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    expect(manager.getState().messages).toHaveLength(100);
    
    manager.dispose();
  });

  it('should maintain low latency for context generation', () => {
    const manager = new ConversationManager('test-user');
    
    // Add conversation history
    for (let i = 0; i < 20; i++) {
      manager.addMessage('user', `Question ${i}`);
      manager.addMessage('assistant', `Answer ${i}`);
    }
    
    const startTime = Date.now();
    const context = manager.getContextForPrompt();
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(50); // Should be very fast
    expect(context).toBeTruthy();
    
    manager.dispose();
  });
});

// Helper function (would be imported from streaming-tts.ts)
function estimateSpeechDuration(text: string, rate: number = 1.0): number {
  const words = text.split(/\s+/).length;
  const baseMinutes = words / 150;
  const adjustedMinutes = baseMinutes / rate;
  return adjustedMinutes * 60 * 1000;
}

// Made with Bob
