/**
 * AI Vision Analysis Service
 * 
 * Uses Gemini Vision API to analyze student drawings, handwriting,
 * fraction shading, and other visual work.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const VISION_MODEL = process.env.GEMINI_VISION_MODEL || process.env.GEMINI_MODEL || 'gemini-3.6-flash';

export interface VisionAnalysisRequest {
  imageData: string; // Base64 encoded image
  activityType: 'handwriting' | 'fraction' | 'drawing' | 'number';
  expectedContent: string;
  grade: string;
  subject: string;
  additionalContext?: string;
}

export interface VisionAnalysisResult {
  score: number; // 0-100
  accuracy: number; // 0-1
  detectedContent: string;
  strengths: string[];
  areasForImprovement: string[];
  specificErrors: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  studentFeedback: string;
  requiresIntervention: boolean;
  interventionReason?: string;
  teacherNotes: string;
}

/**
 * Analyze handwriting
 */
export async function analyzeHandwriting(
  request: VisionAnalysisRequest
): Promise<VisionAnalysisResult> {
  const model = genAI.getGenerativeModel({ model: VISION_MODEL });

  const prompt = `You are an expert Grade ${request.grade} teacher analyzing a student's handwriting.

Task: The student was asked to write: "${request.expectedContent}"

Analyze the image and provide a JSON response with the following structure:
{
  "score": <number 0-100>,
  "accuracy": <number 0-1>,
  "detectedContent": "<what you see written>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "areasForImprovement": ["<area 1>", "<area 2>"],
  "specificErrors": [
    {
      "type": "<error type>",
      "description": "<description>",
      "severity": "<low|medium|high>"
    }
  ],
  "studentFeedback": "<encouraging feedback for 7-year-old>",
  "requiresIntervention": <true|false>,
  "interventionReason": "<reason if true>",
  "teacherNotes": "<notes for teacher>"
}

Scoring criteria:
- Letter formation accuracy (40%)
- Size and proportion (20%)
- Alignment and spacing (20%)
- Stroke order (if visible) (20%)

Be encouraging and age-appropriate. Focus on what the student did well before mentioning improvements.`;

  try {
    // Convert base64 to proper format for Gemini
    const imagePart = {
      inlineData: {
        data: request.imageData.split(',')[1], // Remove data:image/png;base64, prefix
        mimeType: 'image/png',
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const analysis: VisionAnalysisResult = JSON.parse(jsonMatch[0]);
    return analysis;
  } catch (error) {
    console.error('Error analyzing handwriting:', error);
    throw error;
  }
}

/**
 * Analyze fraction shading
 */
export async function analyzeFractionShading(
  request: VisionAnalysisRequest
): Promise<VisionAnalysisResult> {
  const model = genAI.getGenerativeModel({ model: VISION_MODEL });

  const prompt = `You are an expert Grade ${request.grade} mathematics teacher analyzing fraction work.

Task: The student was asked to shade ${request.expectedContent} of the shape.

Analyze the image and provide a JSON response with the following structure:
{
  "score": <number 0-100>,
  "accuracy": <number 0-1>,
  "detectedContent": "<what fraction was shaded>",
  "strengths": ["<what student understood>"],
  "areasForImprovement": ["<misconceptions or errors>"],
  "specificErrors": [
    {
      "type": "<error type>",
      "description": "<description>",
      "severity": "<low|medium|high>"
    }
  ],
  "studentFeedback": "<simple explanation for 7-year-old>",
  "requiresIntervention": <true|false>,
  "interventionReason": "<reason if true>",
  "teacherNotes": "<notes for teacher>"
}

Scoring criteria:
- Correct number of parts shaded (50%)
- Accuracy of shading (30%)
- Understanding of equal parts (20%)

Use simple language. If incorrect, explain clearly what the correct answer should be.`;

  try {
    const imagePart = {
      inlineData: {
        data: request.imageData.split(',')[1],
        mimeType: 'image/png',
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const analysis: VisionAnalysisResult = JSON.parse(jsonMatch[0]);
    return analysis;
  } catch (error) {
    console.error('Error analyzing fraction:', error);
    throw error;
  }
}

/**
 * Analyze number writing
 */
export async function analyzeNumberWriting(
  request: VisionAnalysisRequest
): Promise<VisionAnalysisResult> {
  const model = genAI.getGenerativeModel({ model: VISION_MODEL });

  const prompt = `You are an expert Grade ${request.grade} mathematics teacher analyzing number writing.

Task: The student was asked to write the number: ${request.expectedContent}

Analyze the image and provide a JSON response with the following structure:
{
  "score": <number 0-100>,
  "accuracy": <number 0-1>,
  "detectedContent": "<what number you see>",
  "strengths": ["<what student did well>"],
  "areasForImprovement": ["<what needs work>"],
  "specificErrors": [
    {
      "type": "<error type>",
      "description": "<description>",
      "severity": "<low|medium|high>"
    }
  ],
  "studentFeedback": "<encouraging feedback for 7-year-old>",
  "requiresIntervention": <true|false>,
  "interventionReason": "<reason if true>",
  "teacherNotes": "<notes for teacher>"
}

Scoring criteria:
- Correct digit (40%)
- Proper formation (30%)
- Size and proportion (20%)
- Correct orientation (10%)

Be encouraging. Focus on correct elements before mentioning errors.`;

  try {
    const imagePart = {
      inlineData: {
        data: request.imageData.split(',')[1],
        mimeType: 'image/png',
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const analysis: VisionAnalysisResult = JSON.parse(jsonMatch[0]);
    return analysis;
  } catch (error) {
    console.error('Error analyzing number:', error);
    throw error;
  }
}

/**
 * Analyze general drawing
 */
export async function analyzeDrawing(
  request: VisionAnalysisRequest
): Promise<VisionAnalysisResult> {
  const model = genAI.getGenerativeModel({ model: VISION_MODEL });

  const prompt = `You are an expert Grade ${request.grade} teacher analyzing a student's drawing.

Task: The student was asked to draw: "${request.expectedContent}"
${request.additionalContext ? `Additional context: ${request.additionalContext}` : ''}

Analyze the image and provide a JSON response with the following structure:
{
  "score": <number 0-100>,
  "accuracy": <number 0-1>,
  "detectedContent": "<what you see in the drawing>",
  "strengths": ["<creative elements>", "<technical skills>"],
  "areasForImprovement": ["<suggestions>"],
  "specificErrors": [],
  "studentFeedback": "<encouraging, creative feedback for 7-year-old>",
  "requiresIntervention": false,
  "interventionReason": "",
  "teacherNotes": "<observations for teacher>"
}

Scoring criteria:
- Relevance to prompt (40%)
- Creativity and effort (30%)
- Technical execution (20%)
- Completeness (10%)

Be very encouraging. Celebrate creativity and effort. This is about expression, not perfection.`;

  try {
    const imagePart = {
      inlineData: {
        data: request.imageData.split(',')[1],
        mimeType: 'image/png',
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const analysis: VisionAnalysisResult = JSON.parse(jsonMatch[0]);
    return analysis;
  } catch (error) {
    console.error('Error analyzing drawing:', error);
    throw error;
  }
}

/**
 * Main analysis function that routes to appropriate analyzer
 */
export async function analyzeVisionSubmission(
  request: VisionAnalysisRequest
): Promise<VisionAnalysisResult> {
  switch (request.activityType) {
    case 'handwriting':
      return analyzeHandwriting(request);
    case 'fraction':
      return analyzeFractionShading(request);
    case 'number':
      return analyzeNumberWriting(request);
    case 'drawing':
      return analyzeDrawing(request);
    default:
      throw new Error(`Unknown activity type: ${request.activityType}`);
  }
}

/**
 * Batch analyze multiple submissions (for teacher review)
 */
export async function batchAnalyzeSubmissions(
  requests: VisionAnalysisRequest[]
): Promise<VisionAnalysisResult[]> {
  const results = await Promise.all(
    requests.map(request => analyzeVisionSubmission(request))
  );
  return results;
}

/**
 * Generate intervention report for teacher
 */
export interface InterventionReport {
  studentId: string;
  studentName: string;
  totalSubmissions: number;
  averageScore: number;
  commonErrors: Array<{
    type: string;
    frequency: number;
    examples: string[];
  }>;
  recommendedActions: string[];
  urgency: 'low' | 'medium' | 'high';
}

export function generateInterventionReport(
  submissions: Array<{
    studentId: string;
    studentName: string;
    analysis: VisionAnalysisResult;
  }>
): InterventionReport {
  const studentId = submissions[0]?.studentId || '';
  const studentName = submissions[0]?.studentName || '';
  const totalSubmissions = submissions.length;
  
  // Calculate average score
  const averageScore = submissions.reduce((sum, s) => sum + s.analysis.score, 0) / totalSubmissions;
  
  // Identify common errors
  const errorMap = new Map<string, { frequency: number; examples: string[] }>();
  
  submissions.forEach(({ analysis }) => {
    analysis.specificErrors.forEach(error => {
      const existing = errorMap.get(error.type) || { frequency: 0, examples: [] };
      existing.frequency++;
      if (existing.examples.length < 3) {
        existing.examples.push(error.description);
      }
      errorMap.set(error.type, existing);
    });
  });
  
  const commonErrors = Array.from(errorMap.entries())
    .map(([type, data]) => ({ type, ...data }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);
  
  // Generate recommendations
  const recommendedActions: string[] = [];
  
  if (averageScore < 50) {
    recommendedActions.push('Schedule one-on-one session to review fundamentals');
    recommendedActions.push('Provide additional practice materials');
  } else if (averageScore < 70) {
    recommendedActions.push('Provide targeted practice on identified weak areas');
    recommendedActions.push('Consider peer tutoring or small group work');
  }
  
  commonErrors.forEach(error => {
    if (error.frequency >= totalSubmissions * 0.5) {
      recommendedActions.push(`Focus on ${error.type} - appears in ${error.frequency} submissions`);
    }
  });
  
  // Determine urgency
  const urgency: 'low' | 'medium' | 'high' = 
    averageScore < 40 ? 'high' :
    averageScore < 60 ? 'medium' : 'low';
  
  return {
    studentId,
    studentName,
    totalSubmissions,
    averageScore,
    commonErrors,
    recommendedActions,
    urgency,
  };
}

// Made with Bob
