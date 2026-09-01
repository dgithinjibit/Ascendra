import type { StrandInfo } from "../types";

/** Grade 9 Mathematics — Junior Secondary (KICD) */
export const grade9Mathematics: StrandInfo[] = [
  {
    name: "1.0 Numbers and Operations",
    subStrands: [
      { name: "1.1 Real Numbers", lessons: 10, keyInquiryQuestion: "What are real numbers and their properties?" },
      { name: "1.2 Indices and Logarithms", lessons: 12, keyInquiryQuestion: "How do indices and logarithms work?" },
      { name: "1.3 Number Patterns and Sequences", lessons: 10, keyInquiryQuestion: "How do we identify and use patterns?" },
    ],
  },
  {
    name: "2.0 Algebra",
    subStrands: [
      { name: "2.1 Quadratic Equations", lessons: 12, keyInquiryQuestion: "How do we solve quadratic equations?" },
      { name: "2.2 Algebraic Fractions", lessons: 10, keyInquiryQuestion: "How do we simplify and operate on algebraic fractions?" },
      { name: "2.3 Inequalities", lessons: 8, keyInquiryQuestion: "How do we represent and solve inequalities graphically?" },
    ],
  },
  {
    name: "3.0 Geometry and Trigonometry",
    subStrands: [
      { name: "3.1 Circle Theorems", lessons: 12, keyInquiryQuestion: "What are the properties of circles?" },
      { name: "3.2 Coordinate Geometry", lessons: 10, keyInquiryQuestion: "How do we use coordinates to solve problems?" },
      { name: "3.3 Trigonometric Applications", lessons: 12, keyInquiryQuestion: "How do we apply trigonometry to real-world problems?" },
    ],
  },
  {
    name: "4.0 Mensuration",
    subStrands: [
      { name: "4.1 Area and Perimeter", lessons: 10, keyInquiryQuestion: "How do we calculate area and perimeter of complex shapes?" },
      { name: "4.2 Surface Area and Volume", lessons: 10, keyInquiryQuestion: "How do we find surface area and volume of solids?" },
    ],
  },
  {
    name: "5.0 Statistics and Probability",
    subStrands: [
      { name: "5.1 Statistical Analysis", lessons: 10, keyInquiryQuestion: "How do we interpret statistical data?" },
      { name: "5.2 Probability in Practice", lessons: 8, keyInquiryQuestion: "How do we use probability in decision making?" },
    ],
  },
];
