import type { StrandInfo } from "../types";

/**
 * Grade 6 Science and Technology — Official KICD Upper Primary Curriculum Design
 * Source: Kenya Institute of Curriculum Development (kicd.ac.ke)
 * Total: 120 lessons (4 lessons/week × 30 weeks)
 */
export const grade6ScienceTechnology: StrandInfo[] = [
  {
    name: "1.0 Living Things and their Environment",
    subStrands: [
      { name: "1.1 Cell — the Basic Unit of Life", lessons: 12, keyInquiryQuestion: "What is a cell and why is it important to living things?" },
      { name: "1.2 Micro-organisms", lessons: 14, keyInquiryQuestion: "How do micro-organisms affect human life?" },
      { name: "1.3 Human Excretory System", lessons: 10, keyInquiryQuestion: "How does the human excretory system maintain health?" },
      { name: "1.4 Interdependence of Living Things", lessons: 10, keyInquiryQuestion: "How do living things depend on each other?" },
    ],
  },
  {
    name: "2.0 Matter",
    subStrands: [
      { name: "2.1 Acids and Bases", lessons: 10, keyInquiryQuestion: "What are acids and bases and how are they used?" },
      { name: "2.2 Fuels", lessons: 10, keyInquiryQuestion: "What are fuels and what are their effects on the environment?" },
      { name: "2.3 Environmental Pollution", lessons: 12, keyInquiryQuestion: "How does pollution affect the environment and what can we do?" },
    ],
  },
  {
    name: "3.0 Force and Energy",
    subStrands: [
      { name: "3.1 Levers", lessons: 12, keyInquiryQuestion: "How do levers make work easier?" },
      { name: "3.2 Magnetism", lessons: 10, keyInquiryQuestion: "What are the properties and uses of magnets?" },
      { name: "3.3 Solar Energy", lessons: 10, keyInquiryQuestion: "How can solar energy be harnessed and used?" },
    ],
  },
];
