# 🚀 PersonaAI – Build Your AI Digital Twin

> **Your AI-Powered Digital Twin for Interviews, Career Growth, and Personal Branding**

PersonaAI is an AI-powered web application that creates a **Digital Twin** of a user by understanding their resume, projects, certifications, skills, achievements, and portfolio. It acts as a personalized AI assistant capable of answering profile-based questions, explaining projects, preparing users for interviews, generating professional branding content, and providing personalized career guidance.

The application uses **Large Language Models (LLMs)** with **Prompt Engineering**, **Context Injection**, and **Guardrails** to ensure all responses are generated only from the uploaded profile information.

---

# ✨ Features

## 👤 Profile Builder
- Upload Resume (PDF)
- Upload Supporting Documents (PDF/DOCX)
- Extract and consolidate profile information
- Build a personalized AI knowledge base

---

## 🤖 AI Digital Twin Chat
- Ask questions about your profile
- AI answers exactly as if you were answering
- Context-aware and profile-restricted responses
- Guardrails prevent unrelated or hallucinated answers

Example:
- Introduce yourself
- What are your technical skills?
- Tell me about your projects.

---

## 📊 Profile Insights
Automatically analyzes the uploaded profile and generates:

- Technical Skills
- Projects
- Strengths
- Areas of Improvement
- Experience Summary
- Suggested Career Roles

---

## 🚀 AI Project Explainer

Automatically identifies projects from the uploaded profile and generates:

- Project Overview
- Problem Statement
- Solution
- Architecture
- Workflow
- Technology Stack
- Challenges
- Future Scope
- STAR Explanation
- Resume Explanation
- Interview Questions

---

## 🎯 AI Career Advisor

Provides personalized career guidance including:

- Candidate Profile Summary
- Top Career Recommendations
- Match Scores
- Skill Gap Analysis
- Learning Roadmap
- Industry Readiness
- Interview Preparation
- Suggested Projects
- Next Career Steps

---

## 📝 Branding Content Generator

Generate professional branding content such as:

- LinkedIn Summary
- Resume Summary
- Portfolio About
- Professional Bio

---

## 🎤 AI Interview Simulator

Simulates interview sessions including:

- HR Interview
- Technical Interview
- Personalized Questions
- Feedback
- Suggestions
- Performance Score

---

## 🛡 Guardrails

PersonaAI only answers questions based on the uploaded profile.

If information is unavailable, it politely responds:

> *"I couldn't find this information in your uploaded documents."*

---

# 🏗 Project Architecture

```text
                User
                  │
                  ▼
      HTML + CSS + JavaScript
                  │
                  ▼
            FastAPI Backend
                  │
      ┌───────────┼────────────┐
      │           │            │
      ▼           ▼            ▼
 Prompt Builder  Parser   Guardrails
      │
      ▼
   AI Provider Layer
(Groq / Gemini / OpenRouter / HuggingFace)
      │
      ▼
 Large Language Model
      │
      ▼
 Personalized Response
```

---

# 🛠 Tech Stack

## Frontend

- HTML5
- CSS3
- Vanilla JavaScript

---

## Backend

- Python
- FastAPI
- Uvicorn
- Pydantic

---

## AI Providers

Primary

- ✅ Groq (Llama 3.3 70B)

Supported

- Google Gemini
- OpenRouter
- Hugging Face

---

## Document Processing

- PyPDF2
- PyMuPDF
- python-docx
- RapidOCR

---

## Storage

Current Version

- Local Uploads
- JSON Configuration

Future Version

- Supabase Storage
- PostgreSQL
- Vector Database

---

# 📂 Project Structure

```text
PersonaAI/
│
├── app/
│   ├── api/
│   │   ├── chat.py
│   │   ├── upload.py
│   │   ├── interview.py
│   │   ├── resume.py
│   │   └── career.py
│   │
│   ├── config/
│   │   ├── config.py
│   │   ├── settings.py
│   │   └── paths.py
│   │
│   ├── guardrails/
│   ├── prompts/
│   ├── rag/
│   ├── services/
│   ├── utils/
│   ├── static/
│   │   ├── css/
│   │   ├── components/
│   │   ├── pages/
│   │   └── index.html
│   │
│   └── main.py
│
├── uploads/
├── requirements.txt
├── runtime.txt
├── README.md
└── config.json
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/PersonaAI.git

cd PersonaAI
```

---

## Create Virtual Environment

Windows

```bash
python -m venv venv

venv\Scripts\activate
```

Linux / macOS

```bash
python3 -m venv venv

source venv/bin/activate
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Start the Application

```bash
uvicorn app.main:app --reload --port 8080
```

---

Open

```
http://127.0.0.1:8080
```

---

# 🌐 Deployment

The project is deployment-ready.

Recommended Platforms:

- Render
- Railway
- Fly.io

Production Recommendation:

- FastAPI
- Supabase Storage
- PostgreSQL
- Cloud Object Storage

---

# 🔑 Configuration

Configure your preferred AI provider from the **Settings** page.

Supported Providers

- Groq
- Google Gemini
- OpenRouter
- Hugging Face

API keys can also be provided using environment variables during deployment.

---

# 📚 AI Concepts Used

- Large Language Models (LLMs)
- Prompt Engineering
- Context Injection
- AI Guardrails
- Resume Understanding
- Profile-Based Question Answering
- AI Interview Simulation
- Personalized Career Recommendation
- AI Content Generation

---

# 🚀 Future Enhancements

- User Authentication
- Multi-user Support
- Cloud Storage
- Vector Database (RAG)
- Conversation History
- Analytics Dashboard
- Voice-Based Digital Twin
- Avatar Integration

---

# 📸 Screenshots

> Add screenshots of:
>
> - Home Page
> - Upload Profile
> - AI Chat
> - Twin Insights
> - Career Advisor
> - Interview Simulator

---

# 👨‍💻 Developed By

**PersonaAI Development Team**

Built using **FastAPI**, **Python**, **Vanilla JavaScript**, and **Large Language Models (LLMs)**.

---

# 📄 License

This project is developed for educational and demonstration purposes.
