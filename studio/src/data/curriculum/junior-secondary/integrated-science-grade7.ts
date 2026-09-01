import type { StrandInfo } from "../types";

/**
 * Grade 7 Integrated Science — Junior Secondary
 * Source: Kenya Institute of Curriculum Development (kicd.ac.ke)
 * Total: 120 lessons (4 lessons/week × 30 weeks)
 */
export const grade7IntegratedScience: StrandInfo[] = [
  {
    name: "1.0 Classification of Living Things",
    subStrands: [
      { name: "1.1 Characteristics of Living Things", lessons: 8, keyInquiryQuestion: "What makes something alive?" },
      { name: "1.2 Kingdoms of Living Things", lessons: 10, keyInquiryQuestion: "How are living things grouped?" },
    ],
  },
  {
    name: "2.0 Matter",
    subStrands: [
      { name: "2.1 States of Matter", lessons: 10, keyInquiryQuestion: "What are the different forms of matter?" },
      { name: "2.2 Properties of Matter", lessons: 10, keyInquiryQuestion: "How can we describe and measure matter?" },
      { name: "2.3 Changes in Matter", lessons: 8, keyInquiryQuestion: "How does matter change from one form to another?" },
    ],
  },
  {
    name: "3.0 Energy",
    subStrands: [
      { name: "3.1 Forms of Energy", lessons: 10, keyInquiryQuestion: "What are the different types of energy around us?" },
      { name: "3.2 Energy Transformations", lessons: 8, keyInquiryQuestion: "How does energy change from one form to another?" },
      { name: "3.3 Sources of Energy", lessons: 8, keyInquiryQuestion: "Where do we get energy from?" },
    ],
  },
  {
    name: "4.0 Force and Motion",
    subStrands: [
      { name: "4.1 Types of Forces", lessons: 10, keyInquiryQuestion: "What forces act on objects around us?" },
      { name: "4.2 Effects of Forces", lessons: 8, keyInquiryQuestion: "How do forces change the motion of objects?" },
    ],
  },
  {
    name: "5.0 Earth and Space",
    subStrands: [
      { name: "5.1 The Solar System", lessons: 10, keyInquiryQuestion: "What makes up our solar system?" },
      { name: "5.2 The Earth", lessons: 10, keyInquiryQuestion: "What are the layers and features of Earth?" },
      { name: "5.3 Weather and Climate", lessons: 10, keyInquiryQuestion: "How do weather and climate affect our lives?" },
    ],
  },
];
