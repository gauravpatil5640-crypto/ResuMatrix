# 🚀 ResuMatrix: Multi-Agent AI Resume Optimization Engine

ResuMatrix is a high-performance, single-page web application that automates contextual resume adaptation. By deploying a deterministic multi-agent linear pipeline, the system extracts a candidate's core identity, optimizes experience bullets against target hard-skill metrics, and renders a print-ready document layout with zero formatting risk.

🔗 **Live Deployment:** 
---

## 🏗️ System Architecture & Data Pipeline

The application transitions from unstructured user data inputs to fully structured presentation layers across four isolated execution phases:

1. **The Ingestion Layer:** The web UI securely captures the candidate's original resume text data and target job requirements.
2. **The Architect Agent:** Uses In-Context Learning (ICL) to isolate user identity metrics and rewrite background sentences using high-impact action verbs without creating hallucinations.
3. **The Auditor Agent:** Simulates a corporate Applicant Tracking System (ATS) parser to mathematically verify keyword insertion density and compute a compliance quality score (0% to 100%).
4. **The Stylist Agent:** Maps the finalized data points natively into semantic, responsive HTML/CSS structures, bypassing markdown block parsing errors.

---

## 🛠️ Tech Stack & Integration Points

- **Frontend Interface:** Vanilla HTML5, CSS3 (Glassmorphic design variables), JavaScript (Asynchronous Streams & Client-side Rendering).
- **Animation Framework:** Animate.css via CDN for native micro-interaction processing.
- **Orchestration Backend:** Dify Workflow Engine.
- **AI Core:** Google Gemini 2.5 Flash API via automated system prompt constraints.
- **Deployment & Hosting:** Netlify Static Engine.

---

## ⚙️ Local Installation & Development

To run this project locally on your machine, clone the repository and establish your access variables:

```bash
# Clone the repository
git clone [https://github.com/YOUR_USERNAME/resumatrix-ai-optimizer.git](https://github.com/YOUR_USERNAME/resumatrix-ai-optimizer.git)

# Navigate into the project directory
cd resumatrix-ai-optimizer