import type { StrandInfo } from "../types";

/**
 * Grade 6 Creative Arts — Official KICD Upper Primary Curriculum Design
 * Source: Kenya Institute of Curriculum Development (kicd.ac.ke)
 * Total: 180 lessons (6 lessons/week × 30 weeks)
 */
export const grade6CreativeArts: StrandInfo[] = [
  {
    name: "1.0 Art and Craft",
    subStrands: [
      { name: "1.1 Drawing", lessons: 14, keyInquiryQuestion: "How can drawing be used to communicate ideas and emotions?" },
      { name: "1.2 Painting", lessons: 14, keyInquiryQuestion: "How can painting techniques be used creatively?" },
      { name: "1.3 Collage", lessons: 10, keyInquiryQuestion: "How can collage be used to express creativity?" },
      { name: "1.4 Tie and Dye and Batik", lessons: 12, keyInquiryQuestion: "How are tie and dye and batik used in textile design?" },
      { name: "1.5 Sculpture and Modelling", lessons: 12, keyInquiryQuestion: "How do sculpture and modelling develop creativity?" },
    ],
  },
  {
    name: "2.0 Music",
    subStrands: [
      { name: "2.1 Singing", lessons: 24, keyInquiryQuestion: "How do we develop good singing and vocal skills?" },
      { name: "2.2 Playing Instruments", lessons: 20, keyInquiryQuestion: "How do we play musical instruments correctly?" },
      { name: "2.3 Music Theory", lessons: 16, keyInquiryQuestion: "How does music theory enhance understanding of music?" },
    ],
  },
  {
    name: "3.0 Physical and Health Education",
    subStrands: [
      { name: "3.1 Athletics", lessons: 20, keyInquiryQuestion: "How does participation in athletics improve physical health?" },
      { name: "3.2 Games and Sports", lessons: 24, keyInquiryQuestion: "What values do games and sports teach us?" },
      { name: "3.3 Gymnastics and Dance", lessons: 14, keyInquiryQuestion: "How do gymnastics and dance promote body coordination?" },
    ],
  },
];
