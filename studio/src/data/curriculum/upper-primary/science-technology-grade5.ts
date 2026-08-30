import type { StrandInfo } from "../types";

/**
 * Grade 5 Science and Technology — Official KICD Upper Primary Curriculum Design
 * Source: Kenya Institute of Curriculum Development (kicd.ac.ke)
 * Total: 120 lessons (4 lessons/week × 30 weeks)
 */
export const grade5ScienceTechnology: StrandInfo[] = [
  {
    name: "1.0 Living Things and their Environment",
    subStrands: [
      { name: "1.1 Plants", lessons: 14, keyInquiryQuestion: "How are plants classified and how do they reproduce?" },
      { name: "1.2 Animals", lessons: 14, keyInquiryQuestion: "How are animals classified and what are their adaptations?" },
      { name: "1.3 Human Reproductive System", lessons: 10, keyInquiryQuestion: "How does the human reproductive system function?" },
      { name: "1.4 Soil and the Environment", lessons: 10, keyInquiryQuestion: "How does soil support life and how can we conserve it?" },
    ],
  },
  {
    name: "2.0 Matter",
    subStrands: [
      { name: "2.1 Mixtures", lessons: 12, keyInquiryQuestion: "How can mixtures be separated?" },
      { name: "2.2 Air", lessons: 10, keyInquiryQuestion: "What are the properties and uses of air?" },
      { name: "2.3 Water Treatment and Conservation", lessons: 10, keyInquiryQuestion: "How can we treat and conserve water?" },
    ],
  },
  {
    name: "3.0 Force and Energy",
    subStrands: [
      { name: "3.1 Simple Machines", lessons: 12, keyInquiryQuestion: "How do simple machines make work easier?" },
      { name: "3.2 Sound", lessons: 10, keyInquiryQuestion: "How is sound produced and transmitted?" },
      { name: "3.3 Electricity", lessons: 14, keyInquiryQuestion: "How does electricity work and how is it used safely?" },
    ],
  },
];
