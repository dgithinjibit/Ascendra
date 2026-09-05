/**
 * Superintelligence & AI — CBC-aligned curriculum data
 *
 * Sourced from: datasets/superintelligence/Primary level.md
 *              datasets/superintelligence/Jss.md
 *
 * This data is injected into the Omega system prompt via buildDynamicSystemPrompt
 * so the Socratic tutor knows exactly what topics the student is working on.
 *
 * Grade bands:
 *   Primary (Grades 4–6): AI Discovery Level
 *   Junior Secondary (Grades 7–9): AI Explorer Level
 */

export interface SiModule {
  id: string;
  title: string;
  description: string;
  keyTerms: string[];
  kenyanContext: string;
}

export interface SiGrade {
  grade: string;
  theme: string;
  modules: SiModule[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Primary School (Grades 4–6) — AI Discovery Level
// ─────────────────────────────────────────────────────────────────────────────

export const PRIMARY_CURRICULUM: SiGrade[] = [
  {
    grade: 'grade-4',
    theme: 'What is AI?',
    modules: [
      {
        id: 'g4-m1',
        title: 'Technology in our world',
        description: 'Computers, smartphones, tablets — how technology is already part of life in Kenya.',
        keyTerms: ['technology', 'computer', 'smartphone', 'internet'],
        kenyanContext: 'M-Pesa on phones, Safaricom network, digital banking at Equity Bank.',
      },
      {
        id: 'g4-m2',
        title: 'What is Artificial Intelligence?',
        description: 'Stories, examples, games. AI as a tool that learns from data.',
        keyTerms: ['artificial intelligence', 'AI', 'machine learning', 'data'],
        kenyanContext: 'Mpesa fraud detection, crop disease detection by AI cameras on Kenyan farms.',
      },
      {
        id: 'g4-m3',
        title: 'AI that creates',
        description: 'Fun drawing and storytelling tools — how AI can write stories and draw pictures.',
        keyTerms: ['generative AI', 'prompt', 'image generation', 'AI writing'],
        kenyanContext: 'Creating a Kenyan folktale with AI help, drawing traditional patterns.',
      },
      {
        id: 'g4-m4',
        title: 'Responsible use',
        description: 'Online safety, creating good content, being honest about AI.',
        keyTerms: ['online safety', 'responsible AI', 'privacy', 'cyberbullying'],
        kenyanContext: 'Digital Citizens Kenya, safeguarding personal information on school apps.',
      },
    ],
  },
  {
    grade: 'grade-5',
    theme: 'Talking to AI',
    modules: [
      {
        id: 'g5-m1',
        title: 'Giving clear instructions',
        description: 'Programming your friend (unplugged activity). Precision in language.',
        keyTerms: ['instructions', 'algorithm', 'sequence', 'debugging'],
        kenyanContext: 'Giving directions in Nairobi matatu routes — precise vs vague instructions.',
      },
      {
        id: 'g5-m2',
        title: 'Asking good questions',
        description: 'Prompt engineering basics — how question quality affects AI answers.',
        keyTerms: ['prompt', 'prompt engineering', 'question quality', 'context'],
        kenyanContext: 'Asking an AI about Kenyan wildlife, comparing vague vs specific questions.',
      },
      {
        id: 'g5-m3',
        title: 'AI in Kenya',
        description: 'Real examples: agriculture, health, education.',
        keyTerms: ['agritech', 'healthtech', 'edtech', 'local AI'],
        kenyanContext: 'Zindi Africa (Kenyan AI competitions), Gro Intelligence crop forecasting, mHealth apps.',
      },
      {
        id: 'g5-m4',
        title: 'AI art and stories',
        description: 'Create Kenyan folktales with AI — Kikuyu, Luo, Maasai storytelling traditions.',
        keyTerms: ['creative AI', 'folktale', 'storytelling', 'culture'],
        kenyanContext: 'The hare and the lion (Kenyan fable), Swahili proverbs, Gĩkũyũ oral traditions.',
      },
    ],
  },
  {
    grade: 'grade-6',
    theme: 'AI Projects',
    modules: [
      {
        id: 'g6-m1',
        title: 'AI for nature and wildlife',
        description: 'Conservation, Kenyan animals, AI camera traps.',
        keyTerms: ['conservation', 'computer vision', 'camera trap', 'species detection'],
        kenyanContext: 'Maasai Mara wildebeest migration tracking, elephant counting via satellite AI.',
      },
      {
        id: 'g6-m2',
        title: 'AI for health',
        description: 'How computers help doctors diagnose diseases.',
        keyTerms: ['medical AI', 'diagnosis', 'X-ray analysis', 'malaria detection'],
        kenyanContext: 'Zipline drones delivering blood in Kenya, AI malaria detection in Kisumu clinics.',
      },
      {
        id: 'g6-m3',
        title: 'Responsible AI',
        description: 'Ethics, bias, avoiding harm.',
        keyTerms: ['AI ethics', 'bias', 'fairness', 'harm prevention'],
        kenyanContext: 'Why facial recognition fails on darker skin tones, algorithmic bias in loan apps.',
      },
      {
        id: 'g6-m4',
        title: 'Capstone: Community AI Solution',
        description: 'Identify a community problem and propose an AI solution.',
        keyTerms: ['problem-solving', 'AI design', 'community impact', 'presentation'],
        kenyanContext: 'Water access in Arid and Semi-Arid Lands (ASALs), food waste at Gikomba market.',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Junior Secondary School (Grades 7–9) — AI Explorer Level
// ─────────────────────────────────────────────────────────────────────────────

export const JSS_CURRICULUM: SiGrade[] = [
  {
    grade: 'grade-7',
    theme: 'AI Foundations',
    modules: [
      {
        id: 'g7-m1',
        title: 'Generative AI concepts',
        description: 'History of AI, types of AI systems, how LLMs work.',
        keyTerms: ['generative AI', 'LLM', 'neural network', 'training data', 'Transformer'],
        kenyanContext: 'How iHub Nairobi helps Kenyan startups build AI products.',
      },
      {
        id: 'g7-m2',
        title: 'Creative AI — art, music, writing',
        description: 'Using AI tools to generate images, compose music, write stories.',
        keyTerms: ['text-to-image', 'Gemini', 'Imagen', 'creative generation'],
        kenyanContext: 'Generating benga music lyrics, Makonde sculpture-inspired AI art.',
      },
      {
        id: 'g7-m3',
        title: 'AI as a study partner',
        description: 'How to use AI tools responsibly to support your learning.',
        keyTerms: ['study assistant', 'academic integrity', 'fact-checking', 'critical thinking'],
        kenyanContext: 'Using AI to study for KCPE, understanding hallucinations vs facts.',
      },
    ],
  },
  {
    grade: 'grade-8',
    theme: 'AI Skills Development',
    modules: [
      {
        id: 'g8-m1',
        title: 'Prompt engineering',
        description: 'Chain-of-thought reasoning, ReAct prompting, zero-shot vs few-shot.',
        keyTerms: ['prompt engineering', 'chain-of-thought', 'ReAct', 'few-shot learning'],
        kenyanContext: 'Prompting an AI to explain why maize prices change after a drought.',
      },
      {
        id: 'g8-m2',
        title: 'Code generation with AI',
        description: 'Using AI to write and explain Python code.',
        keyTerms: ['code generation', 'Python', 'debugging', 'GitHub Copilot'],
        kenyanContext: 'Writing a Python script to track school fees payments using M-Pesa data.',
      },
      {
        id: 'g8-m3',
        title: 'Building simple chatbots',
        description: 'Conversational AI, intents, fallbacks, Vertex AI basics.',
        keyTerms: ['chatbot', 'conversational AI', 'intent', 'Dialogflow', 'Vertex AI'],
        kenyanContext: 'Building a chatbot to answer questions about KCSE registration.',
      },
      {
        id: 'g8-m4',
        title: 'Ethics — bias, privacy, fairness',
        description: 'Deep dive into AI safety and responsible development.',
        keyTerms: ['AI bias', 'privacy', 'data protection', 'Kenya Data Protection Act'],
        kenyanContext: 'Kenya Data Protection Act 2019, Huduma Namba controversy.',
      },
    ],
  },
  {
    grade: 'grade-9',
    theme: 'AI Project Development',
    modules: [
      {
        id: 'g9-m1',
        title: 'Advanced concepts — embeddings and vector search',
        description: 'How AI represents meaning as numbers. Semantic search.',
        keyTerms: ['embeddings', 'vector database', 'semantic search', 'RAG'],
        kenyanContext: 'Searching Kenyan legal documents by meaning, not just keywords.',
      },
      {
        id: 'g9-m2',
        title: 'Business applications in Kenya',
        description: 'Agritech, fintech, tourism. AI solving Kenyan business problems.',
        keyTerms: ['agritech', 'fintech', 'AI startup', 'business model'],
        kenyanContext: 'Twiga Foods AI demand forecasting, M-Kopa solar using AI credit scoring.',
      },
      {
        id: 'g9-m3',
        title: 'Capstone: AI solution for a local problem',
        description: 'Design, build, and present a complete AI project.',
        keyTerms: ['product design', 'MVP', 'pitch', 'deployment', 'impact measurement'],
        kenyanContext: 'Projects: informal school data management, boda boda safety monitoring, market price alerts via SMS.',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Lookup helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getSiCurriculumForGrade(grade: string): SiGrade | null {
  const all = [...PRIMARY_CURRICULUM, ...JSS_CURRICULUM];
  return all.find((g) => g.grade === grade) ?? null;
}

export function getSiModuleContext(grade: string): string {
  const gradeData = getSiCurriculumForGrade(grade);
  if (!gradeData) {
    return 'Kenya K-12 Generative AI and Superintelligence curriculum. Help the student explore AI concepts relevant to their grade.';
  }

  const moduleList = gradeData.modules
    .map((m) => `• ${m.title}: ${m.description}`)
    .join('\n');

  const allKeyTerms = [...new Set(gradeData.modules.flatMap((m) => m.keyTerms))].join(', ');
  const kenyanContexts = gradeData.modules.map((m) => m.kenyanContext).join(' ');

  return [
    `Superintelligence & AI — ${gradeData.theme} (${grade})`,
    '',
    'Curriculum modules:',
    moduleList,
    '',
    `Key terms the student is learning: ${allKeyTerms}`,
    '',
    `Kenyan context to use in examples: ${kenyanContexts}`,
    '',
    'Use these Kenyan examples when explaining concepts. Always connect AI topics to real Kenyan life.',
  ].join('\n');
}
