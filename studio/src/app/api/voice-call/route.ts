/**
 * Voice Call API Routes
 * Handles AI response generation and conversation persistence
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * POST /api/voice-call
 * Generate AI response for voice conversation
 */
export async function POST(request: NextRequest) {
  try {
    const { message, context, history, userId, conversationId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate AI response using your preferred AI service
    // Example with Groq (fast inference)
    const aiResponse = await generateAIResponse(message, context, history);

    // Save to Supabase if conversation ID provided
    if (conversationId && supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase.from('voice_messages').insert({
        conversation_id: conversationId,
        user_id: userId,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      });

      await supabase.from('voice_messages').insert({
        conversation_id: conversationId,
        user_id: userId,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      response: aiResponse,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Voice call API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}

/**
 * Generate AI response using Groq or other AI service
 */
async function generateAIResponse(
  message: string,
  context: string,
  history: string
): Promise<string> {
  const provider = (process.env.LLM_PROVIDER || 'groq').trim().toLowerCase();
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (provider === 'gemini' && geminiApiKey) {
    try {
      const gemini = new GoogleGenerativeAI(geminiApiKey);
      const model = gemini.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
        systemInstruction: `You are Mwalimu AI, an intelligent and friendly educational tutor. Help students learn through concise, natural conversation.\n\nContext:\n${context}\n\nRecent conversation:\n${history}\n\nKeep responses to 2-3 short sentences, use age-appropriate language, encourage the learner, and ask one follow-up question when useful.`,
      });
      const result = await model.generateContent(message);
      return result.response.text().trim() || 'Could you try that again?';
    } catch (error) {
      console.error('Gemini voice response error:', error);
      return 'I had trouble processing that. Could you try again?';
    }
  }
  
  if (!groqApiKey) {
    // Fallback to simple response
    return `I understand you said: "${message}". Let me help you with that.`;
  }

  try {
    // Use Groq for fast inference when Gemini is not selected.
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile', // Fast and capable model
        messages: [
          {
            role: 'system',
            content: `You are Mwalmu AI, an intelligent and friendly educational tutor. You help students learn through natural conversation.

Context:
${context}

Recent conversation:
${history}

Guidelines:
- Keep responses concise and conversational (2-3 sentences max)
- Use simple, clear language appropriate for the student's level
- Be encouraging and supportive
- Ask follow-up questions to check understanding
- Adapt to topic changes seamlessly
- If interrupted, acknowledge and adjust gracefully`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 150, // Keep responses short for voice
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`${provider} API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'I apologize, I had trouble understanding. Could you rephrase that?';

  } catch (error) {
    console.error(`${provider} generation error:`, error);
    return 'I apologize, I had trouble processing that. Could you try again?';
  }
}

/**
 * GET /api/voice-call?conversationId=xxx
 * Retrieve conversation history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversationId' },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('voice_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ messages: data });

  } catch (error) {
    console.error('Failed to retrieve conversation:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversation' },
      { status: 500 }
    );
  }
}

// Made with Bob
