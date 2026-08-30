import type { StrandInfo } from "../types";

/**
 * Grade 6 Christian Religious Education — Official KICD Upper Primary Curriculum Design
 * Source: Kenya Institute of Curriculum Development (kicd.ac.ke)
 * Total: 90 lessons (3 lessons/week × 30 weeks)
 */
export const grade6CRE: StrandInfo[] = [
  {
    name: "1.0 Creation",
    subStrands: [
      { name: "1.1 Stewardship of God's Creation", lessons: 8, keyInquiryQuestion: "What does it mean to be a good steward of creation?" },
      { name: "1.2 Environmental Challenges and Christian Response", lessons: 8, keyInquiryQuestion: "How should Christians respond to environmental challenges?" },
    ],
  },
  {
    name: "2.0 The Bible",
    subStrands: [
      { name: "2.1 The New Testament", lessons: 8, keyInquiryQuestion: "What is the significance of the New Testament in Christian life?" },
      { name: "2.2 Lessons from New Testament Figures", lessons: 8, keyInquiryQuestion: "What lessons can we draw from New Testament figures?" },
      { name: "2.3 The Ten Commandments", lessons: 8, keyInquiryQuestion: "How do the Ten Commandments guide Christian living?" },
    ],
  },
  {
    name: "3.0 Jesus Christ and Christian Living",
    subStrands: [
      { name: "3.1 The Passion, Death and Resurrection of Jesus", lessons: 10, keyInquiryQuestion: "What is the significance of Jesus' passion, death and resurrection?" },
      { name: "3.2 Christian Life and Discipleship", lessons: 8, keyInquiryQuestion: "What does it mean to be a disciple of Jesus today?" },
    ],
  },
  {
    name: "4.0 The Church",
    subStrands: [
      { name: "4.1 The Church as a Community of Faith", lessons: 8, keyInquiryQuestion: "How does the church function as a community of faith?" },
      { name: "4.2 Christian Leadership", lessons: 8, keyInquiryQuestion: "What qualities define a good Christian leader?" },
    ],
  },
  {
    name: "5.0 Social Issues",
    subStrands: [
      { name: "5.1 Drug and Substance Abuse", lessons: 6, keyInquiryQuestion: "What does Christianity teach about drug and substance abuse?" },
      { name: "5.2 Living Positively in Society", lessons: 6, keyInquiryQuestion: "How can Christians contribute positively to society?" },
    ],
  },
];
