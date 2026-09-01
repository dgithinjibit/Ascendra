import type { StrandInfo } from "../types";

/**
 * Grade 7 English — Junior Secondary
 * Source: Kenya Institute of Curriculum Development (kicd.ac.ke)
 * Total: 150 lessons (5 lessons/week × 30 weeks)
 */
export const grade7English: StrandInfo[] = [
  {
    name: "1.0 Listening and Speaking",
    subStrands: [
      { name: "1.1 Listening Comprehension", lessons: 15, keyInquiryQuestion: "How do we listen effectively to understand spoken language?" },
      { name: "1.2 Speaking and Presentation", lessons: 15, keyInquiryQuestion: "How do we communicate ideas clearly in speech?" },
      { name: "1.3 Pronunciation and Fluency", lessons: 10, keyInquiryQuestion: "How do we speak English clearly and confidently?" },
    ],
  },
  {
    name: "2.0 Reading",
    subStrands: [
      { name: "2.1 Reading Comprehension", lessons: 20, keyInquiryQuestion: "How do we understand and interpret texts?" },
      { name: "2.2 Vocabulary Development", lessons: 15, keyInquiryQuestion: "How do we expand our word knowledge?" },
      { name: "2.3 Reading for Information", lessons: 10, keyInquiryQuestion: "How do we extract information from different texts?" },
    ],
  },
  {
    name: "3.0 Writing",
    subStrands: [
      { name: "3.1 Writing Skills", lessons: 20, keyInquiryQuestion: "How do we write different types of texts effectively?" },
      { name: "3.2 Grammar and Mechanics", lessons: 20, keyInquiryQuestion: "How do we use grammar correctly in writing?" },
      { name: "3.3 Creative Writing", lessons: 10, keyInquiryQuestion: "How do we express our imagination through writing?" },
    ],
  },
  {
    name: "4.0 Language Use",
    subStrands: [
      { name: "4.1 Parts of Speech", lessons: 10, keyInquiryQuestion: "How do different words function in sentences?" },
      { name: "4.2 Sentence Structure", lessons: 5, keyInquiryQuestion: "How do we construct clear and correct sentences?" },
    ],
  },
];
