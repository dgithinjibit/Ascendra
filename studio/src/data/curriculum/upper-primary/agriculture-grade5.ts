import type { StrandInfo } from "../types";

/**
 * Grade 5 Agriculture — Official KICD Upper Primary Curriculum Design
 * Source: Kenya Institute of Curriculum Development (kicd.ac.ke)
 * Total: 120 lessons (4 lessons/week × 30 weeks)
 */
export const grade5Agriculture: StrandInfo[] = [
  {
    name: "1.0 Agricultural Production",
    subStrands: [
      { name: "1.1 Crop Farming", lessons: 20, keyInquiryQuestion: "What are the steps involved in crop farming?" },
      { name: "1.2 Animal Rearing", lessons: 18, keyInquiryQuestion: "How do we rear animals for food and income?" },
      { name: "1.3 Horticulture", lessons: 14, keyInquiryQuestion: "What is horticulture and why is it important in Kenya?" },
    ],
  },
  {
    name: "2.0 Agricultural Inputs",
    subStrands: [
      { name: "2.1 Soil Fertility Management", lessons: 16, keyInquiryQuestion: "How do we manage and maintain soil fertility?" },
      { name: "2.2 Pest and Disease Management", lessons: 14, keyInquiryQuestion: "How do we identify and manage pests and diseases?" },
      { name: "2.3 Water Management in Agriculture", lessons: 12, keyInquiryQuestion: "How is water managed in agricultural production?" },
    ],
  },
  {
    name: "3.0 Agricultural Economics and Marketing",
    subStrands: [
      { name: "3.1 Farm Records", lessons: 12, keyInquiryQuestion: "Why are farm records important?" },
      { name: "3.2 Marketing Farm Produce", lessons: 14, keyInquiryQuestion: "How is farm produce marketed effectively?" },
    ],
  },
];
