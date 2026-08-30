import type { StrandInfo } from "../types";

/**
 * PP1 Christian Religious Education — Official KICD Pre-Primary Curriculum Design
 * Source: Kenya Institute of Curriculum Development (kicd.ac.ke)
 * Total: ~90 lessons across 3 terms
 */
export const pp1CRE: StrandInfo[] = [
  {
    name: "1.0 God Made Me",
    subStrands: [
      { name: "1.1 Parts of the Body", lessons: 8, keyInquiryQuestion: "Who made our bodies?" },
      { name: "1.2 Special Abilities", lessons: 8, keyInquiryQuestion: "What special abilities has God given you?" },
    ],
  },
  {
    name: "2.0 My Family",
    subStrands: [
      { name: "2.1 God Gives Us Families", lessons: 8, keyInquiryQuestion: "Why did God give us families?" },
      { name: "2.2 Roles in the Family", lessons: 6, keyInquiryQuestion: "How do family members help each other?" },
    ],
  },
  {
    name: "3.0 My Home",
    subStrands: [
      { name: "3.1 God Provides a Home", lessons: 8, keyInquiryQuestion: "Why do we thank God for our homes?" },
      { name: "3.2 Caring for Our Home", lessons: 6, keyInquiryQuestion: "How do we show gratitude by caring for our home?" },
    ],
  },
  {
    name: "4.0 My School",
    subStrands: [
      { name: "4.1 God's Gift of Learning", lessons: 8, keyInquiryQuestion: "How is learning a gift from God?" },
      { name: "4.2 Sharing and Caring at School", lessons: 6, keyInquiryQuestion: "How can we show God's love at school?" },
    ],
  },
  {
    name: "5.0 My Neighbourhood",
    subStrands: [
      { name: "5.1 God Made the Environment", lessons: 8, keyInquiryQuestion: "What has God created in our neighbourhood?" },
      { name: "5.2 Caring for God's Creation", lessons: 8, keyInquiryQuestion: "How can we take care of what God has created?" },
    ],
  },
  {
    name: "6.0 Celebrations and Festivals",
    subStrands: [
      { name: "6.1 Christian Celebrations", lessons: 8, keyInquiryQuestion: "What do Christians celebrate and why?" },
      { name: "6.2 Sharing and Giving", lessons: 6, keyInquiryQuestion: "Why is it good to share with others?" },
    ],
  },
];
