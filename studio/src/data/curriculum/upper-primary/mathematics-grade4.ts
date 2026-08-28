import type { StrandInfo } from "../types";

/**
 * Grade 4 Mathematics — Official KICD Upper Primary Curriculum Design
 * Source: Kenya Institute of Curriculum Development (kicd.ac.ke)
 * Total: 150 lessons (5 lessons/week × 30 weeks)
 */
export const grade4Mathematics: StrandInfo[] = [
  {
    name: "1.0 Numbers",
    subStrands: [
      { name: "1.1 Whole Numbers", lessons: 20, keyInquiryQuestion: "How do we use whole numbers in daily life?" },
      { name: "1.2 Addition", lessons: 6, keyInquiryQuestion: "How is addition used in solving problems?" },
      { name: "1.3 Subtraction", lessons: 6, keyInquiryQuestion: "How is subtraction used in everyday situations?" },
      { name: "1.4 Multiplication", lessons: 8, keyInquiryQuestion: "How does multiplication help us work faster?" },
      { name: "1.5 Division", lessons: 8, keyInquiryQuestion: "How is division used to share equally?" },
      { name: "1.6 Fractions", lessons: 10, keyInquiryQuestion: "How are fractions used in real life?" },
      { name: "1.7 Decimals", lessons: 6, keyInquiryQuestion: "Where do we use decimals in everyday life?" },
    ],
  },
  {
    name: "2.0 Measurement",
    subStrands: [
      { name: "2.1 Length", lessons: 10, keyInquiryQuestion: "How do we measure length accurately?" },
      { name: "2.2 Area", lessons: 8, keyInquiryQuestion: "How do we find the area of surfaces?" },
      { name: "2.3 Volume", lessons: 6, keyInquiryQuestion: "How do we measure the volume of objects?" },
      { name: "2.4 Capacity", lessons: 8, keyInquiryQuestion: "How is capacity measured and used?" },
      { name: "2.5 Mass", lessons: 8, keyInquiryQuestion: "How do we measure and compare mass?" },
      { name: "2.6 Time", lessons: 8, keyInquiryQuestion: "How do we read and use time in daily life?" },
      { name: "2.7 Money", lessons: 8, keyInquiryQuestion: "How do we use money in buying and selling?" },
    ],
  },
  {
    name: "3.0 Geometry",
    subStrands: [
      { name: "3.1 Lines and Angles", lessons: 8, keyInquiryQuestion: "How do we identify and use lines and angles?" },
      { name: "3.2 Plane Figures", lessons: 8, keyInquiryQuestion: "How do we identify and draw plane figures?" },
      { name: "3.3 Three Dimensional (3-D) Objects", lessons: 6, keyInquiryQuestion: "How do 3-D objects differ from plane figures?" },
    ],
  },
  {
    name: "4.0 Data Handling",
    subStrands: [
      { name: "4.1 Data Representation", lessons: 6, keyInquiryQuestion: "How do we collect, represent and interpret data?" },
    ],
  },
];
