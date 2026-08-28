import type { StrandInfo } from "../types";

/**
 * Grade 5 Social Studies — Official KICD Upper Primary Curriculum Design
 * Source: Kenya Institute of Curriculum Development (kicd.ac.ke)
 * Total: 90 lessons (3 lessons/week × 30 weeks)
 */
export const grade5SocialStudies: StrandInfo[] = [
  {
    name: "1.0 Natural and Historic Built Environments",
    subStrands: [
      { name: "1.1 Map of Kenya", lessons: 8, keyInquiryQuestion: "What are the features on a map of Kenya?" },
      { name: "1.2 Physical Features of Kenya", lessons: 8, keyInquiryQuestion: "What major physical features are found in Kenya?" },
      { name: "1.3 Climate of Kenya", lessons: 6, keyInquiryQuestion: "How does climate vary across different regions of Kenya?" },
      { name: "1.4 Historic Built Environments in Kenya", lessons: 6, keyInquiryQuestion: "What historic built environments are significant in Kenya?" },
    ],
  },
  {
    name: "2.0 People and Population",
    subStrands: [
      { name: "2.1 Population of Kenya", lessons: 6, keyInquiryQuestion: "What factors influence the distribution of Kenya's population?" },
      { name: "2.2 Migration", lessons: 6, keyInquiryQuestion: "What causes people to migrate and what are the effects?" },
    ],
  },
  {
    name: "3.0 Social Organisations",
    subStrands: [
      { name: "3.1 Cultural Practices in Kenya", lessons: 6, keyInquiryQuestion: "How do cultural practices promote national unity?" },
      { name: "3.2 Family and the Community", lessons: 4, keyInquiryQuestion: "What is the role of the family and community in society?" },
    ],
  },
  {
    name: "4.0 Resources and Economic Activities",
    subStrands: [
      { name: "4.1 Agriculture in Kenya", lessons: 8, keyInquiryQuestion: "What types of agriculture are practised in Kenya?" },
      { name: "4.2 Tourism in Kenya", lessons: 6, keyInquiryQuestion: "What are the main tourist attractions in Kenya?" },
      { name: "4.3 Trade in Kenya", lessons: 6, keyInquiryQuestion: "What is the importance of trade to Kenya's economy?" },
    ],
  },
  {
    name: "5.0 Citizenship and Governance in Kenya",
    subStrands: [
      { name: "5.1 National Values and Principles", lessons: 6, keyInquiryQuestion: "What national values guide Kenya as a country?" },
      { name: "5.2 The National Government", lessons: 6, keyInquiryQuestion: "How is the national government of Kenya structured?" },
      { name: "5.3 Human Rights", lessons: 6, keyInquiryQuestion: "What are human rights and how are they protected in Kenya?" },
      { name: "5.4 Conflict Resolution", lessons: 6, keyInquiryQuestion: "How can conflicts be resolved peacefully?" },
    ],
  },
];
