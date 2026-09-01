import type { StrandInfo } from "../types";

/**
 * Grade 7 Mathematics — Junior Secondary
 * Source: Kenya Institute of Curriculum Development (kicd.ac.ke)
 * Based on CBC Junior Secondary curriculum design
 * Total: 150 lessons (5 lessons/week × 30 weeks)
 */
export const grade7Mathematics: StrandInfo[] = [
  {
    name: "1.0 Numbers",
    subStrands: [
      { name: "1.1 Integers", lessons: 12, keyInquiryQuestion: "How do we use positive and negative numbers in real life?" },
      { name: "1.2 Fractions", lessons: 10, keyInquiryQuestion: "How do we perform operations on fractions?" },
      { name: "1.3 Decimals", lessons: 10, keyInquiryQuestion: "How are decimals used in measurements and money?" },
      { name: "1.4 Percentages", lessons: 8, keyInquiryQuestion: "Where do we use percentages in daily life?" },
      { name: "1.5 Ratios and Proportions", lessons: 10, keyInquiryQuestion: "How do ratios help us compare quantities?" },
    ],
  },
  {
    name: "2.0 Algebra",
    subStrands: [
      { name: "2.1 Algebraic Expressions", lessons: 12, keyInquiryQuestion: "How do we represent real-world situations using algebra?" },
      { name: "2.2 Linear Equations", lessons: 10, keyInquiryQuestion: "How do we solve equations to find unknown values?" },
      { name: "2.3 Inequalities", lessons: 8, keyInquiryQuestion: "How do we represent and solve inequalities?" },
    ],
  },
  {
    name: "3.0 Measurement",
    subStrands: [
      { name: "3.1 Perimeter and Area", lessons: 10, keyInquiryQuestion: "How do we calculate perimeter and area of compound shapes?" },
      { name: "3.2 Surface Area and Volume", lessons: 10, keyInquiryQuestion: "How do we find surface area and volume of 3D objects?" },
      { name: "3.3 Units of Measurement", lessons: 8, keyInquiryQuestion: "How do we convert between different units?" },
    ],
  },
  {
    name: "4.0 Geometry",
    subStrands: [
      { name: "4.1 Angles and Lines", lessons: 10, keyInquiryQuestion: "What are the properties of angles and lines?" },
      { name: "4.2 Triangles and Quadrilaterals", lessons: 10, keyInquiryQuestion: "What are the properties of triangles and quadrilaterals?" },
      { name: "4.3 Circles", lessons: 8, keyInquiryQuestion: "What are the parts and properties of circles?" },
    ],
  },
  {
    name: "5.0 Statistics and Probability",
    subStrands: [
      { name: "5.1 Data Collection and Representation", lessons: 8, keyInquiryQuestion: "How do we collect and display data?" },
      { name: "5.2 Measures of Central Tendency", lessons: 6, keyInquiryQuestion: "How do we find mean, median, and mode?" },
      { name: "5.3 Probability", lessons: 6, keyInquiryQuestion: "How do we predict the likelihood of events?" },
    ],
  },
];
