# Junior Secondary School: Generative AI Curriculum
## Homeschool Edition (Grades 7–9, Ages 12–15)

**Course Duration:** 6 Weeks (2 sessions per week)  
**Prerequisites:** Basic computer literacy, interest in technology  
**Platform:** Google Cloud + Vertex AI + Cloud Skills Boost + GitHub

---

## Quick Links to All Resources

| Resource | URL |
|----------|-----|
| **Cloud Skills Boost (Labs)** | [https://www.cloudskillsboost.google/catalog_lab/1281](https://www.cloudskillsboost.google/catalog_lab/1281) (use incognito, campaign codes may vary) |
| **GitHub Notebook Repository** | [https://github.com/GoogleCloudPlatform/generative-ai](https://github.com/GoogleCloudPlatform/generative-ai) |
| **Google Cloud Setup Guide** | [https://cloud.google.com/vertex-ai/docs/quickstart](https://cloud.google.com/vertex-ai/docs/quickstart) |
| **Google Colab** | [https://colab.research.google.com](https://colab.research.google.com) |
| **Vertex AI Workbench** | [https://cloud.google.com/vertex-ai-notebooks](https://cloud.google.com/vertex-ai-notebooks) |
| **Codelabs (Dialogflow CX, etc.)** | [https://codelabs.developers.google.com](https://codelabs.developers.google.com) |
| **Weekly Updates** | [goo.gle/GenAI-Labs](https://goo.gle/GenAI-Labs) |

---

## Week 1: Introduction to Generative AI

### Session 1: What is Generative AI?
- Understanding AI vs. Generative AI
- Real-world examples: text, image, audio generation
- Discussion: How do you use AI already?

### Session 2: Getting Started with AI Tools
- Introduction to Vertex AI and Gemini
- Setting up a Google Cloud project (with adult supervision)
- **Lab:** *Getting Started with the Vertex AI Gemini API and Python SDK*  
  → Access via Cloud Skills Boost: [Catalog Lab 1281](https://www.cloudskillsboost.google/catalog_lab/1281)  
- **Lab:** *Multimodality with Gemini* (same platform)

**Key Terms:** AI, Generative AI, Model, API, SDK

---

## Week 2: Communicating with AI (Prompt Engineering)

### Session 1: How to Talk to AI
- What is prompt engineering?
- Writing clear, specific instructions
- Practice: generate stories, poems, and code

### Session 2: Advanced Prompting
- Chain of Thought reasoning
- ReAct (Reasoning + Acting)
- Safety and responsibility – understanding limitations
- **Notebooks (run on Colab or Workbench):**
  - [Intro Gemini](https://github.com/GoogleCloudPlatform/generative-ai/blob/main/gemini/intro_gemini.ipynb)
  - [Chain of Thought & ReAct](https://github.com/GoogleCloudPlatform/generative-ai/blob/main/gemini/chain_of_thought_react.ipynb)
  - [Safety Ratings & Thresholds](https://github.com/GoogleCloudPlatform/generative-ai/blob/main/gemini/safety_ratings_thresholds.ipynb)

**Key Terms:** Prompt Engineering, Chain of Thought, ReAct, Safety Thresholds

---

## Week 3: Creative AI – Image Generation

### Session 1: AI Image Creation
- How Imagen works
- Text‑to‑image and style controls
- **Notebook:** [Create High Quality Visual Assets with Imagen and Gemini](https://github.com/GoogleCloudPlatform/generative-ai/blob/main/imagen/create_high_quality_visual_assets.ipynb)

### Session 2: Image Editing & Custom Styling
- Editing, inpainting, and style transfer
- Copyright and ethical considerations
- Project: Design a book cover for your favourite story

**Key Terms:** Image Generation, Imagen, Style Transfer, Copyright

---

## Week 4: Smart AI – Memory and Search

### Session 1: How AI Remembers Things
- What are embeddings? (text as numbers)
- Vector databases – AI's long‑term memory
- **Notebook:** [Getting Started with Text Embeddings + Vertex AI Vector Search](https://github.com/GoogleCloudPlatform/generative-ai/blob/main/embeddings/text_embeddings_vector_search.ipynb)

### Session 2: AI That Can Search and Write Code
- Code generation and completion with AI
- Using AI to help with Python coding
- **Notebook:** [Code Generation](https://github.com/GoogleCloudPlatform/generative-ai/blob/main/code_generation/code_generation.ipynb)

**Key Terms:** Embeddings, Vector Databases, Code Generation

---

## Week 5: Building AI Assistants and Chat Applications

### Session 1: RAG – Retrieval-Augmented Generation
- How AI answers questions using external knowledge
- **Notebook:** [Multimodal Retrieval Augmented Generation (RAG) using Vertex AI Gemini API](https://github.com/GoogleCloudPlatform/generative-ai/blob/main/rag/multimodal_rag_gemini.ipynb)

### Session 2: Enterprise Chat Applications
- Building a chat app for your community
- Handling errors and intent management
- **Codelabs (run on Google Cloud):**
  - [Create a Generative Chat App with Vertex AI Conversation](https://codelabs.developers.google.com/codelabs/vertex-ai-conversation-chat)
  - [Increase intent coverage and handle errors gracefully with generative fallback](https://codelabs.developers.google.com/codelabs/vertex-ai-fallback)
  - [Informed decision making using Dialogflow CX generators and data stores](https://codelabs.developers.google.com/codelabs/dialogflow-cx-generators)

**Key Terms:** RAG, Chat Application, Multimodal, Intent, Fallback

---

## Week 6: Deploying AI and Future Directions

### Session 1: Sharing Your AI Creations
- Deploying apps to the cloud
- Demo App and sample applications
- [GitHub Repository – sample applications](https://github.com/GoogleCloudPlatform/generative-ai/tree/main/sample-apps)

### Session 2: Improving AI Performance
- Fine‑tuning models for specific tasks
- Reinforcement Learning from Human Feedback (RLHF)
- **Notebooks:**
  - [Tuning and deploy a foundation model](https://github.com/GoogleCloudPlatform/generative-ai/blob/main/tuning/tuning_foundation_model.ipynb)
  - [Vertex AI LLM Reinforcement Learning from Human Feedback](https://github.com/GoogleCloudPlatform/generative-ai/blob/main/rlhf/rlhf_vertex_ai.ipynb)

**Key Terms:** Deployment, Tuning, RLHF, Foundation Model

---

## Assessment and Projects
- **Weekly labs** (40%) – completion of Cloud Skills Boost labs
- **Hands‑on projects** (30%) – portfolio of AI‑generated work
- **Participation** (15%) – discussion and engagement
- **Final project** (15%) – present an AI application idea

---

## Safety and Ethical Guidelines
1. All cloud activities must be supervised by an adult.
2. Use only the free credits ($300) – do not enter billing details without parent/guardian.
3. Create only appropriate, respectful content.
4. Never share personal information with AI tools.
5. Always verify AI outputs; you are responsible for the final result.

---

## Setup Instructions (for Parents/Guardians)
1. Create a Google Cloud account at [cloud.google.com](https://cloud.google.com).
2. Enable the Vertex AI API.
3. Set up billing for the free credits (no charge until credits are exhausted).
4. Create a new Project.
5. Launch Vertex AI Workbench or use Google Colab.
6. Clone the Generative AI repo:
   ```bash
   git clone https://github.com/GoogleCloudPlatform/generative-ai.git