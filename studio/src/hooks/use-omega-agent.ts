/**
 * Omega Agent React Hook
 * 
 * This hook integrates the Omega Agent with React components,
 * providing intelligent learning decisions and cross-device sync.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { OmegaAgent, getOmegaAgent, LearningDecision } from '@/lib/omega-agent/core';
import { useAuth } from '@/hooks/use-auth';
import { useSessionSync } from '@/hooks/use-session-sync';

interface OmegaAgentState {
  agent: OmegaAgent | null;
  isInitialized: boolean;
  isThinking: boolean;
  lastDecision: LearningDecision | null;
  error: string | null;
}

interface LearningInput {
  currentProgress: number;
  timeSpent: number;
  strugglingAreas: string[];
  recentActivity: string;
}

export function useOmegaAgent() {
  const { user } = useAuth();
  const { session } = useSessionSync();
  const [state, setState] = useState<OmegaAgentState>({
    agent: null,
    isInitialized: false,
    isThinking: false,
    lastDecision: null,
    error: null
  });

  const initializationRef = useRef<boolean>(false);

  /**
   * Initialize Omega Agent when user is available
   */
  useEffect(() => {
    if (!user?.id || initializationRef.current) return;

    async function initializeAgent() {
      try {
        initializationRef.current = true;
        setState(prev => ({ ...prev, error: null }));

        const agent = getOmegaAgent(user.id);
        await agent.initialize();

        setState(prev => ({
          ...prev,
          agent,
          isInitialized: true
        }));

        console.log('🧠 Omega Agent initialized for user:', user.id);
      } catch (error) {
        console.error('❌ Omega Agent initialization failed:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize Omega Agent',
          isInitialized: false
        }));
        initializationRef.current = false;
      }
    }

    initializeAgent();
  }, [user?.id]);

  /**
   * Adapt to device changes
   */
  const adaptToDevice = useCallback((deviceType: 'phone' | 'tablet' | 'desktop') => {
    if (state.agent) {
      state.agent.adaptToDevice(deviceType);
    }
  }, [state.agent]);

  /**
   * Make intelligent learning decision
   */
  const makeDecision = useCallback(async (input: LearningInput): Promise<LearningDecision | null> => {
    if (!state.agent || !state.isInitialized) {
      console.warn('Omega Agent not initialized, cannot make decision');
      return null;
    }

    setState(prev => ({ ...prev, isThinking: true, error: null }));

    try {
      const decision = await state.agent.makeDecision(input);
      
      setState(prev => ({
        ...prev,
        lastDecision: decision,
        isThinking: false
      }));

      console.log('🎯 Omega Agent decision:', decision.reasoning);
      return decision;
    } catch (error) {
      console.error('❌ Omega Agent decision failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Decision making failed',
        isThinking: false
      }));
      return null;
    }
  }, [state.agent, state.isInitialized]);

  /**
   * Process teacher feedback through Omega Agent
   */
  const processTeacherFeedback = useCallback(async (feedback: {
    type: 'encouragement' | 'hint' | 'correction';
    message: string;
    urgency: 'low' | 'medium' | 'high';
  }) => {
    if (!state.agent) return;

    try {
      await state.agent.processTeacherFeedback(feedback);
      console.log('👩‍🏫 Teacher feedback processed through Omega Agent');
    } catch (error) {
      console.error('❌ Failed to process teacher feedback:', error);
    }
  }, [state.agent]);

  /**
   * Get personalized activity recommendation
   */
  const getNextActivity = useCallback(async (currentContext: {
    subject: string;
    competencyLevel: number;
    recentActivities: string[];
  }): Promise<string | null> => {
    if (!state.agent) return null;

    const decision = await makeDecision({
      currentProgress: currentContext.competencyLevel * 20, // Scale to percentage
      timeSpent: 300, // Default 5 minutes
      strugglingAreas: currentContext.competencyLevel < 2 ? [currentContext.subject] : [],
      recentActivity: currentContext.recentActivities[0] || 'none'
    });

    return decision?.nextActivity || null;
  }, [makeDecision, state.agent]);

  /**
   * Sync Omega Agent state across devices
   */
  const syncAcrossDevices = useCallback(async () => {
    if (state.agent) {
      await state.agent.syncAcrossDevices();
    }
  }, [state.agent]);

  /**
   * Auto-detect device type and adapt
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && state.agent) {
      const width = window.innerWidth;
      let deviceType: 'phone' | 'tablet' | 'desktop' = 'desktop';
      
      if (width <= 768) {
        deviceType = 'phone';
      } else if (width <= 1024) {
        deviceType = 'tablet';
      }

      adaptToDevice(deviceType);

      // Listen for device orientation/size changes
      const handleResize = () => {
        const newWidth = window.innerWidth;
        let newDeviceType: 'phone' | 'tablet' | 'desktop' = 'desktop';
        
        if (newWidth <= 768) {
          newDeviceType = 'phone';
        } else if (newWidth <= 1024) {
          newDeviceType = 'tablet';
        }

        if (newDeviceType !== deviceType) {
          adaptToDevice(newDeviceType);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [state.agent, adaptToDevice]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (state.agent) {
        state.agent.cleanup();
      }
    };
  }, [state.agent]);

  return {
    // State
    isInitialized: state.isInitialized,
    isThinking: state.isThinking,
    lastDecision: state.lastDecision,
    error: state.error,

    // Actions
    makeDecision,
    processTeacherFeedback,
    getNextActivity,
    adaptToDevice,
    syncAcrossDevices,

    // Agent instance (for advanced use cases)
    agent: state.agent
  };
}

/**
 * Grade 2 specific helper hook
 */
export function useGrade2OmegaAgent() {
  const omegaAgent = useOmegaAgent();

  /**
   * Get Grade 2 appropriate activity based on CBC competencies
   */
  const getGrade2Activity = useCallback(async (subject: 'mathematics' | 'english' | 'kiswahili' | 'environmental') => {
    const grade2Activities = {
      mathematics: {
        struggling: ['basic-counting', 'number-recognition', 'shape-sorting'],
        progressing: ['number-garden', 'counting-safari', 'shape-builder'],
        advanced: ['addition-basics', 'pattern-maker', 'measurement-fun']
      },
      english: {
        struggling: ['letter-sounds', 'phonics-basics', 'word-matching'],
        progressing: ['sight-words', 'simple-reading', 'story-builder'],
        advanced: ['reading-comprehension', 'creative-writing', 'grammar-games']
      },
      kiswahili: {
        struggling: ['herufi-sounds', 'maneno-rahisi', 'mazungumzo'],
        progressing: ['kusoma-rahisi', 'mazungumzo-zaidi', 'hadithi-fupi'],
        advanced: ['kusoma-kuelewa', 'kuandika-hadithi', 'lugha-mchezo']
      },
      environmental: {
        struggling: ['my-body', 'family-tree', 'school-environment'],
        progressing: ['plants-animals', 'weather-seasons', 'community-helpers'],
        advanced: ['ecosystem-basics', 'conservation-kids', 'kenya-geography']
      }
    };

    // Get current competency level (mock for now)
    const competencyLevel = 2; // 1=struggling, 2=progressing, 3=advanced
    
    let levelKey: 'struggling' | 'progressing' | 'advanced' = 'progressing';
    if (competencyLevel <= 1) levelKey = 'struggling';
    if (competencyLevel >= 3) levelKey = 'advanced';

    const activities = grade2Activities[subject][levelKey];
    return activities[Math.floor(Math.random() * activities.length)];
  }, []);

  /**
   * Process Grade 2 progress and get cultural adaptation
   */
  const processGrade2Progress = useCallback(async (progress: {
    activity: string;
    subject: string;
    score: number;
    timeSpent: number;
    strugglingWith?: string;
  }) => {
    const decision = await omegaAgent.makeDecision({
      currentProgress: progress.score,
      timeSpent: progress.timeSpent,
      strugglingAreas: progress.strugglingWith ? [progress.strugglingWith] : [],
      recentActivity: progress.activity
    });

    // Add Grade 2 specific enhancements
    if (decision) {
      // Ensure cultural context for Kenyan Grade 2
      decision.culturalAdaptation = [
        ...decision.culturalAdaptation,
        'Use Kenyan animals and examples',
        'Include Kiswahili vocabulary',
        'Reference familiar objects (matatus, ugali, etc.)'
      ];

      // Adjust teacher alert for Grade 2 context
      if (decision.teacherAlert && progress.score < 60) {
        decision.teacherAlert = `Grade 2 student struggling with ${progress.subject}. Consider using hands-on materials or visual aids. Student may benefit from peer collaboration or break time.`;
      }
    }

    return decision;
  }, [omegaAgent]);

  return {
    ...omegaAgent,
    getGrade2Activity,
    processGrade2Progress
  };
}

export default useOmegaAgent;