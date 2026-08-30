import type { StrandInfo } from "../types";

/**
 * PP1 Mathematical Activities — Official KICD Pre-Primary Curriculum Design
 * Source: Kenya Institute of Curriculum Development (kicd.ac.ke)
 * Total: ~130 lessons across 3 terms
 */
export const pp1MathematicalActivities: StrandInfo[] = [
  {
    name: "1.0 My Self",
    subStrands: [
      { name: "1.1 Sorting and Grouping", lessons: 10, keyInquiryQuestion: "Which objects do you play with at home? How can we group them?" },
      { name: "1.2 Matching and Pairing", lessons: 8, keyInquiryQuestion: "How can you match and pair clothes worn every day?" },
      { name: "1.3 Ordering", lessons: 8, keyInquiryQuestion: "How can we order play objects in the immediate environment?" },
      { name: "1.4 Patterns", lessons: 8, keyInquiryQuestion: "How can you arrange play objects to make a pattern?" },
    ],
  },
  {
    name: "2.0 My Family",
    subStrands: [
      { name: "2.1 Rote Counting (1–10)", lessons: 8, keyInquiryQuestion: "How can you count numbers 1–10?" },
      { name: "2.2 Number Recognition (1–9)", lessons: 8, keyInquiryQuestion: "Which number is shown on the flashcard?" },
      { name: "2.3 Counting Concrete Objects (1–9)", lessons: 8, keyInquiryQuestion: "How many objects are these?" },
      { name: "2.4 Number Sequencing (1–9)", lessons: 8, keyInquiryQuestion: "Which number comes after this number?" },
      { name: "2.5 Number Writing (1–9)", lessons: 8, keyInquiryQuestion: "How do we form these number symbols?" },
    ],
  },
  {
    name: "3.0 My Home",
    subStrands: [
      { name: "3.1 Sides of Objects", lessons: 8, keyInquiryQuestion: "Which are the sides of these concrete objects?" },
      { name: "3.2 Mass (Heavy and Light)", lessons: 6, keyInquiryQuestion: "Which object is heavy or light?" },
      { name: "3.3 Capacity", lessons: 6, keyInquiryQuestion: "How many small containers can fill the big container?" },
      { name: "3.4 Time (Daily Routines)", lessons: 6, keyInquiryQuestion: "What do you do in the morning before you go to school?" },
      { name: "3.5 Money (Kenyan Currency sh.1)", lessons: 6, keyInquiryQuestion: "What can you see on the coin?" },
      { name: "3.6 Area (Surface of Objects)", lessons: 6, keyInquiryQuestion: "How many small similar objects can cover a given surface?" },
    ],
  },
  {
    name: "4.0 My School",
    subStrands: [
      { name: "4.1 Lines", lessons: 8, keyInquiryQuestion: "What can you see on these objects?" },
      { name: "4.2 Shapes", lessons: 8, keyInquiryQuestion: "How do these objects look like?" },
    ],
  },
  {
    name: "5.0 My Neighbourhood",
    subStrands: [
      { name: "5.1 Number Concepts (10–15)", lessons: 8, keyInquiryQuestion: "How many objects are in your neighbourhood?" },
      { name: "5.2 Addition (1–9)", lessons: 8, keyInquiryQuestion: "How many objects do you have altogether?" },
    ],
  },
  {
    name: "6.0 My Environment",
    subStrands: [
      { name: "6.1 Subtraction (1–9)", lessons: 8, keyInquiryQuestion: "How many objects are left?" },
      { name: "6.2 Length (Long and Short)", lessons: 6, keyInquiryQuestion: "Which object is longer or shorter?" },
    ],
  },
];
