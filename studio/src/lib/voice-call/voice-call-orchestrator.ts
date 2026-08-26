/**
 * Voice Call Orchestrator (FREE)
 * Main coordinator for low-latency voice conversations
 * 
 * Integrates:
 * - Audio streaming (recording & playback)
 * - Speech recognition (STT)
 * - Text-to-speech (TTS)
 * - Conversation management
 * - Intelligent interruption handling
 * 
 * Achieves near-realistic conversational speed through:
 * - Parallel processing of audio and AI responses
 * - Streaming TTS for immediate playback
 * - Voice Activity Detection for natural turn-taking
 * - Context-aware conversation flow
 */

import { AudioStreamManager, AudioPlaybackManager } from './audio-streaming';
import { StreamingTTSManager } from './streaming-tts';
import { ConversationManager, ConversationMessage } from './conversation-manager';
import { useSpeechRecognition } from '../../hooks/use-speech-recognition';

export interface VoiceCallConfig {
  userId: string;
  conversationId?: string;
  language?: string;
  autoStart?: boolean;
  enableInterruption?: boolean;
  ttsRate?: number;
  vadThreshold?: number;
}

export interface VoiceCallState {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  currentTopic: string;
  latency: {
    stt: number; // Speech-to-text latency
    ai: number; // AI response latency
    tts: number; // Text-to-speech latency
    total: number; // Total round-trip latency
  };
  stats: {
    messageCount: number;
    interruptionCount: number;
    averageLatency: number;
  };
}

export type VoiceCallEventType = 
  | 'call_started'
  | 'call_ended'
  | 'user_speaking'
  | 'user_finished'
  | 'ai_responding'
  | 'ai_finished'
  | 'interruption'
  | 'topic_changed'
  | 'error';

export interface VoiceCallEvent {
  type: VoiceCallEventType;
  timestamp: number;
  data?: any;
}

/**
 * Main Voice Call Orchestrator
 */
export class VoiceCallOrchestrator {
  private audioStream: AudioStreamManager;
  private audioPlayback: AudioPlaybackManager;
  private tts: StreamingTTSManager;
  private conversation: ConversationManager;
  
  private config: Omit<Required<VoiceCallConfig>, 'conversationId'> & {
    conversationId?: string;
  };
  private state: VoiceCallState;
  private eventListeners: Map<VoiceCallEventType, Array<(event: VoiceCallEvent) => void>> = new Map();
  
  private currentTranscript = '';
  private isUserSpeaking = false;
  private lastUserSpeechTime = 0;
  private silenceThreshold = 1500; // ms of silence before processing
  private silenceTimer: NodeJS.Timeout | null = null;
  
  private latencyTracking = {
    sttStart: 0,
    aiStart: 0,
    ttsStart: 0,
  };

  constructor(config: VoiceCallConfig) {
    this.config = {
      userId: config.userId,
      conversationId: config.conversationId ?? undefined,
      language: config.language || 'en-US',
      autoStart: config.autoStart ?? false,
      enableInterruption: config.enableInterruption ?? true,
      ttsRate: config.ttsRate ?? 1.15,
      vadThreshold: config.vadThreshold ?? 0.01,
    };

    // Initialize components
    this.audioStream = new AudioStreamManager({
      sampleRate: 16000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    });

    this.audioPlayback = new AudioPlaybackManager();
    
    this.tts = new StreamingTTSManager({
      rate: this.config.ttsRate,
      lang: this.config.language,
    });

    this.conversation = new ConversationManager(
      this.config.userId,
      this.config.conversationId
    );

    // Initialize state
    this.state = {
      isActive: false,
      isListening: false,
      isSpeaking: false,
      currentTopic: '',
      latency: {
        stt: 0,
        ai: 0,
        tts: 0,
        total: 0,
      },
      stats: {
        messageCount: 0,
        interruptionCount: 0,
        averageLatency: 0,
      },
    };

    // Subscribe to conversation events
    this.conversation.onTopicTransition((transition) => {
      this.state.currentTopic = transition.to;
      this.emitEvent('topic_changed', { transition });
    });

    console.log('🎙️ Voice Call Orchestrator initialized');
  }

  /**
   * Initialize all components (without requesting microphone access yet)
   */
  async initialize(): Promise<void> {
    try {
      // Only initialize audio playback, not recording yet
      // Microphone access will be requested when startCall() is called
      await this.audioPlayback.initialize();
      
      console.log('✅ Voice call system ready');
      
      if (this.config.autoStart) {
        await this.startCall();
      }
    } catch (error) {
      console.error('Failed to initialize voice call:', error);
      this.emitEvent('error', { error });
      throw error;
    }
  }

  /**
   * Start voice call (requests microphone permission here)
   */
  async startCall(): Promise<void> {
    if (this.state.isActive) {
      console.warn('Call already active');
      return;
    }

    try {
      // Initialize audio stream NOW (this will trigger the microphone permission popup)
      await this.audioStream.initialize();
      
      this.state.isActive = true;
      this.state.isListening = true;

      // Start audio recording with callbacks
      this.audioStream.startRecording({
        onAudioChunk: (chunk) => {
          // Audio chunks are processed in real-time
          // Could be sent to server for STT if needed
        },
        onVADChange: (vadResult) => {
          this.handleVADChange(vadResult.isSpeaking);
        },
        onSilenceDetected: () => {
          this.handleSilenceDetected();
        },
      });

      this.emitEvent('call_started', {
        timestamp: Date.now(),
        config: this.config,
      });

      console.log('📞 Voice call started');
    } catch (error) {
      this.state.isActive = false;
      this.state.isListening = false;
      console.error('Failed to start call:', error);
      this.emitEvent('error', { error });
      throw error;
    }
  }

  /**
   * Handle voice activity detection changes
   */
  private handleVADChange(isSpeaking: boolean): void {
    if (isSpeaking && !this.isUserSpeaking) {
      // User started speaking
      this.isUserSpeaking = true;
      this.lastUserSpeechTime = Date.now();
      this.latencyTracking.sttStart = Date.now();

      // If AI is speaking, interrupt it
      if (this.state.isSpeaking && this.config.enableInterruption) {
        this.handleUserInterruption();
      }

      this.emitEvent('user_speaking', { timestamp: Date.now() });
      
      // Clear any pending silence timer
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
    } else if (!isSpeaking && this.isUserSpeaking) {
      // User might have stopped speaking - wait for silence threshold
      this.lastUserSpeechTime = Date.now();
    }
  }

  /**
   * Handle silence detection (user finished speaking)
   */
  private handleSilenceDetected(): void {
    if (!this.isUserSpeaking) return;

    // Set timer to process after silence threshold
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }

    this.silenceTimer = setTimeout(() => {
      this.processUserSpeech();
    }, this.silenceThreshold);
  }

  /**
   * Process user speech and generate AI response
   */
  private async processUserSpeech(): Promise<void> {
    if (!this.currentTranscript.trim()) return;

    this.isUserSpeaking = false;
    const userMessage = this.currentTranscript.trim();
    this.currentTranscript = '';

    // Calculate STT latency
    const sttLatency = Date.now() - this.latencyTracking.sttStart;
    this.state.latency.stt = sttLatency;

    // Add user message to conversation
    this.conversation.addMessage('user', userMessage);
    this.emitEvent('user_finished', { message: userMessage, latency: sttLatency });

    // Generate AI response
    this.latencyTracking.aiStart = Date.now();
    await this.generateAIResponse(userMessage);
  }

  /**
   * Generate and speak AI response
   */
  private async generateAIResponse(userMessage: string): Promise<void> {
    try {
      this.emitEvent('ai_responding', { timestamp: Date.now() });

      // Get conversation context
      const context = this.conversation.getContextForPrompt();
      const recentMessages = this.conversation.getConversationSummary();

      // Generate AI response (integrate with your AI backend)
      const aiResponse = await this.callAIBackend(userMessage, context, recentMessages);

      // Calculate AI latency
      const aiLatency = Date.now() - this.latencyTracking.aiStart;
      this.state.latency.ai = aiLatency;

      // Add AI message to conversation
      this.conversation.addMessage('assistant', aiResponse);

      // Speak response with streaming TTS
      this.latencyTracking.ttsStart = Date.now();
      await this.speakResponse(aiResponse);

      // Calculate total latency
      const totalLatency = Date.now() - this.latencyTracking.sttStart;
      this.state.latency.total = totalLatency;

      // Update stats
      this.updateLatencyStats(totalLatency);

      this.emitEvent('ai_finished', { 
        message: aiResponse, 
        latency: {
          stt: this.state.latency.stt,
          ai: aiLatency,
          tts: this.state.latency.tts,
          total: totalLatency,
        }
      });

    } catch (error) {
      console.error('Failed to generate AI response:', error);
      this.emitEvent('error', { error });
    }
  }

  /**
   * Call AI backend for response generation
   */
  private async callAIBackend(
    userMessage: string,
    context: string,
    recentMessages: string
  ): Promise<string> {
    // TODO: Integrate with your AI backend (Groq, OpenAI, etc.)
    // For now, return a placeholder
    
    // Example integration:
    /*
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        context,
        history: recentMessages,
        stream: true, // Enable streaming for lower latency
      }),
    });

    const data = await response.json();
    return data.response;
    */

    // Placeholder response
    return `I understand you said: "${userMessage}". Let me help you with that.`;
  }

  /**
   * Speak AI response using streaming TTS
   */
  private async speakResponse(text: string): Promise<void> {
    this.state.isSpeaking = true;

    await this.tts.streamText(text, {
      onStart: () => {
        const ttsLatency = Date.now() - this.latencyTracking.ttsStart;
        this.state.latency.tts = ttsLatency;
        console.log(`🔊 TTS started (${ttsLatency}ms latency)`);
      },
      onEnd: () => {
        this.state.isSpeaking = false;
        console.log('🔊 TTS finished');
      },
      onError: (error) => {
        console.error('TTS error:', error);
        this.state.isSpeaking = false;
        this.emitEvent('error', { error });
      },
    });
  }

  /**
   * Handle user interruption
   */
  private handleUserInterruption(): void {
    console.log('⚡ User interrupted AI');

    // Stop TTS immediately
    this.tts.interrupt();
    this.audioPlayback.interrupt();
    
    this.state.isSpeaking = false;
    this.state.stats.interruptionCount++;

    // Mark conversation as interrupted
    this.conversation.handleInterruption(this.currentTranscript);

    this.emitEvent('interruption', {
      timestamp: Date.now(),
      count: this.state.stats.interruptionCount,
    });
  }

  /**
   * Update transcript from speech recognition
   */
  updateTranscript(transcript: string, isFinal: boolean): void {
    if (isFinal) {
      this.currentTranscript += ' ' + transcript;
    } else {
      // Interim results - could be displayed in UI
      this.emitEvent('user_speaking', { 
        transcript, 
        isFinal: false 
      });
    }
  }

  /**
   * Update latency statistics
   */
  private updateLatencyStats(latency: number): void {
    const { stats } = this.state;
    stats.messageCount++;
    stats.averageLatency = 
      (stats.averageLatency * (stats.messageCount - 1) + latency) / stats.messageCount;
  }

  /**
   * End voice call
   */
  async endCall(): Promise<void> {
    if (!this.state.isActive) return;

    this.state.isActive = false;
    this.state.isListening = false;

    // Stop all components
    this.audioStream.stopRecording();
    this.tts.stop();
    this.audioPlayback.stop();

    // End conversation
    this.conversation.endConversation();

    // Clear timers
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    this.emitEvent('call_ended', {
      timestamp: Date.now(),
      stats: this.state.stats,
      duration: Date.now() - this.conversation.getState().startTime,
    });

    console.log('📞 Voice call ended');
  }

  /**
   * Get current state
   */
  getState(): VoiceCallState {
    return { ...this.state };
  }

  /**
   * Get conversation manager
   */
  getConversation(): ConversationManager {
    return this.conversation;
  }

  /**
   * Subscribe to events
   */
  on(eventType: VoiceCallEventType, callback: (event: VoiceCallEvent) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(type: VoiceCallEventType, data?: any): void {
    const event: VoiceCallEvent = {
      type,
      timestamp: Date.now(),
      data,
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.endCall();
    this.audioStream.dispose();
    this.audioPlayback.dispose();
    this.tts.dispose();
    this.conversation.dispose();
    this.eventListeners.clear();
    console.log('🧹 Voice call orchestrator disposed');
  }
}

// Made with Bob
