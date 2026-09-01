import type { StrandInfo } from "../types";

/**
 * Grade 7 Social Studies — Junior Secondary
 * Source: Kenya Institute of Curriculum Development (kicd.ac.ke)
 * Total: 120 lessons (4 lessons/week × 30 weeks)
 */
export const grade7SocialStudies: StrandInfo[] = [
  {
    name: "1.0 Geography",
    subStrands: [
      { name: "1.1 Maps and Map Reading", lessons: 12, keyInquiryQuestion: "How do we use maps to understand our environment?" },
      { name: "1.2 Physical Features of Kenya", lessons: 10, keyInquiryQuestion: "What are the major physical features of Kenya?" },
      { name: "1.3 Climate and Vegetation", lessons: 10, keyInquiryQuestion: "How do climate and vegetation relate to each other?" },
      { name: "1.4 Economic Activities", lessons: 10, keyInquiryQuestion: "What economic activities take place in Kenya?" },
    ],
  },
  {
    name: "2.0 History",
    subStrands: [
      { name: "2.1 Pre-Colonial Kenya", lessons: 10, keyInquiryQuestion: "How did people live in Kenya before colonialism?" },
      { name: "2.2 Colonialism in Kenya", lessons: 10, keyInquiryQuestion: "How did colonialism affect Kenya?" },
      { name: "2.3 Independence and Nation Building", lessons: 10, keyInquiryQuestion: "How did Kenya gain independence?" },
    ],
  },
  {
    name: "3.0 Citizenship and Governance",
    subStrands: [
      { name: "3.1 Rights and Responsibilities", lessons: 8, keyInquiryQuestion: "What are our rights and responsibilities as citizens?" },
      { name: "3.2 Government Systems", lessons: 10, keyInquiryQuestion: "How is the government of Kenya organized?" },
      { name: "3.3 Civic Participation", lessons: 8, keyInquiryQuestion: "How can we participate in governance?" },
    ],
  },
  {
    name: "4.0 Resource Management",
    subStrands: [
      { name: "4.1 Natural Resources", lessons: 8, keyInquiryQuestion: "What natural resources does Kenya have?" },
      { name: "4.2 Conservation and Sustainability", lessons: 6, keyInquiryQuestion: "How do we protect our resources for the future?" },
    ],
  },
  {
    name: "5.0 Contemporary Issues",
    subStrands: [
      { name: "5.1 Technology and Society", lessons: 6, keyInquiryQuestion: "How does technology affect our lives?" },
      { name: "5.2 Global Interdependence", lessons: 6, keyInquiryQuestion: "How is Kenya connected to other countries?" },
    ],
  },
];
