import type { StrandInfo } from "../types";

/**
 * Grade 5 Christian Religious Education — Official KICD Upper Primary Curriculum Design
 * Source: Kenya Institute of Curriculum Development (kicd.ac.ke)
 * Total: 90 lessons (3 lessons/week × 30 weeks)
 */
export const grade5CRE: StrandInfo[] = [
  {
    name: "1.0 Creation",
    subStrands: [
      { name: "1.1 God as the Sustainer of Creation", lessons: 8, keyInquiryQuestion: "How does God sustain His creation?" },
      { name: "1.2 Caring for God's Creation", lessons: 8, keyInquiryQuestion: "How should we care for God's creation?" },
    ],
  },
  {
    name: "2.0 The Bible",
    subStrands: [
      { name: "2.1 Books of the Bible", lessons: 8, keyInquiryQuestion: "How is the Bible organised and what is its significance?" },
      { name: "2.2 Biblical Teachings on Obedience", lessons: 8, keyInquiryQuestion: "What does the Bible teach about obedience?" },
      { name: "2.3 Lessons from Old Testament Figures", lessons: 8, keyInquiryQuestion: "What can we learn from Old Testament figures?" },
    ],
  },
  {
    name: "3.0 Jesus Christ and Christian Living",
    subStrands: [
      { name: "3.1 Jesus as a Teacher", lessons: 8, keyInquiryQuestion: "What did Jesus teach about love and service?" },
      { name: "3.2 Miracles of Jesus", lessons: 8, keyInquiryQuestion: "What do the miracles of Jesus reveal about His power?" },
      { name: "3.3 Christian Virtues", lessons: 8, keyInquiryQuestion: "How do Christian virtues guide our daily living?" },
    ],
  },
  {
    name: "4.0 The Church",
    subStrands: [
      { name: "4.1 Growth of the Early Church", lessons: 8, keyInquiryQuestion: "How did the early church grow and spread?" },
      { name: "4.2 Christian Service in the Community", lessons: 8, keyInquiryQuestion: "How do Christians serve their communities?" },
    ],
  },
  {
    name: "5.0 Social Issues",
    subStrands: [
      { name: "5.1 Healthy Relationships", lessons: 6, keyInquiryQuestion: "What does the Bible say about healthy relationships?" },
      { name: "5.2 Integrity and Responsibility", lessons: 6, keyInquiryQuestion: "How do integrity and responsibility shape our character?" },
    ],
  },
];
