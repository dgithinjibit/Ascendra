import type { StrandInfo } from "../types";

/** Grade 8 Mathematics — Junior Secondary (KICD) */
export const grade8Mathematics: StrandInfo[] = [
  {
    name: "1.0 Numbers",
    subStrands: [
      { name: "1.1 Integers and Operations", lessons: 10, keyInquiryQuestion: "How do we perform operations on integers?" },
      { name: "1.2 Rational Numbers", lessons: 10, keyInquiryQuestion: "What are rational numbers and how do we use them?" },
      { name: "1.3 Irrational Numbers", lessons: 8, keyInquiryQuestion: "What makes a number irrational?" },
      { name: "1.4 Powers and Roots", lessons: 10, keyInquiryQuestion: "How do powers and roots relate?" },
    ],
  },
  {
    name: "2.0 Algebra",
    subStrands: [
      { name: "2.1 Algebraic Expressions and Equations", lessons: 12, keyInquiryQuestion: "How do we simplify and solve algebraic expressions?" },
      { name: "2.2 Simultaneous Equations", lessons: 10, keyInquiryQuestion: "How do we solve two equations together?" },
      { name: "2.3 Quadratic Expressions", lessons: 10, keyInquiryQuestion: "What are quadratic expressions?" },
    ],
  },
  {
    name: "3.0 Geometry",
    subStrands: [
      { name: "3.1 Pythagoras Theorem", lessons: 10, keyInquiryQuestion: "How do we use Pythagoras theorem?" },
      { name: "3.2 Similar and Congruent Figures", lessons: 10, keyInquiryQuestion: "What makes shapes similar or congruent?" },
      { name: "3.3 Transformations", lessons: 10, keyInquiryQuestion: "How do we move and change shapes?" },
    ],
  },
  {
    name: "4.0 Trigonometry",
    subStrands: [
      { name: "4.1 Introduction to Trigonometry", lessons: 12, keyInquiryQuestion: "What is trigonometry used for?" },
      { name: "4.2 Trigonometric Ratios", lessons: 10, keyInquiryQuestion: "How do we find sides and angles in triangles?" },
    ],
  },
  {
    name: "5.0 Statistics and Probability",
    subStrands: [
      { name: "5.1 Data Analysis", lessons: 10, keyInquiryQuestion: "How do we analyze and interpret data?" },
      { name: "5.2 Probability Concepts", lessons: 8, keyInquiryQuestion: "How do we calculate probability?" },
    ],
  },
];
