class PromptBuilder:
    @staticmethod
    def build_system_prompt(context: str) -> str:
        return f"""You are the AI Digital Twin of the user. Your name is PersonaAI.
Your primary objective is to represent the user and answer questions EXACTLY as if you were the user, based ONLY on the provided context below.

CONTEXT (User Profile Data):
{context}

RULES:
1. Answer ONLY using the uploaded profile information.
2. If the user's question asks for information not present in the context, or if the context is empty, reply exactly: "I couldn't find this information in your uploaded documents."
3. Do NOT invent, assume, or extrapolate any information. If it is not in the text, you do not know it.
4. Speak in the first person ("I", "my", "me") when describing the user's achievements, skills, and background.
5. If the request is unrelated to the profile, reply exactly: "I can only answer based on your uploaded profile."
6. Ensure you strictly adhere to the guardrails (rejecting illegal, medical, financial, political, religious, or harmful prompts).
"""

    @staticmethod
    def build_introduction_prompt(context: str, intro_type: str, duration: str) -> str:
        return f"""Based on the following profile context:
{context}

Generate a self-introduction from the user's perspective.
- Type: {intro_type} (e.g., Technical, HR, General)
- Duration: {duration} (e.g., 30 seconds, 1 minute, Detailed)

Make it sound professional, engaging, and matching the requested type and duration. Speak in the first person ("I", "my").
If context is empty or missing necessary details, base it only on what's available or return: "I couldn't find this information in your uploaded documents."
"""

    @staticmethod
    def build_project_prompt(context: str, project_name: str) -> str:
        return f"""You must return a raw, clean JSON object matching the schema below. Do NOT use markdown code block wrappers (do NOT wrap in ```json). Do NOT add introductory or explaining text. Return ONLY valid JSON.

CONTEXT:
{context}

INSTRUCTIONS:
1. Search the context for project "{project_name}". If found, set "found" to true.
2. If NOT found, set "found" to false, scan context for actual projects, and list them in "suggested_projects" (up to 3).
3. Keep all values extremely concise (1-2 sentences maximum, do not write paragraphs).
4. Limit "interview_questions" and "cross_questions" to at most 1-2 short entries to ensure the JSON does not truncate.

JSON Schema to return:
{{
  "project_name": "{project_name}",
  "found": true,
  "sections": {{
    "Project Overview": "Concise 1-sentence overview.",
    "Business Problem": "Core problem addressed.",
    "Objective": "Core objective.",
    "Architecture": "Brief tech architecture.",
    "Workflow": "Data flow/execution steps.",
    "Tech Stack": "**Database**: db\\n**Backend**: backend\\n**Frontend**: frontend\\n**AI Models**: ml_models\\n**External APIs**: integrations\\n**Deployment**: hosting\\n**Security**: auth",
    "Challenges & Solutions": "**Challenges**: main challenge\\n**Solutions**: resolution",
    "Scalability & Future Improvements": "**Scalability**: scaling\\n**Future Improvements**: roadmap",
    "STAR Explanation": "**Situation**: S\\n**Task**: T\\n**Action**: A\\n**Result**: R",
    "Resume Explanation & Pitch": "**Resume Explanation**: 1 resume bullet\\n**Elevator Pitch**: 20-second pitch"
  }},
  "interview_questions": [
    {{
      "question": "Question?",
      "expected_answer": "Expected answer guidance."
    }}
  ],
  "cross_questions": [
    {{
      "question": "Cross question?",
      "expected_answer": "Strong defense guidance."
    }}
  ],
  "suggested_projects": []
}}
"""

    @staticmethod
    def build_interview_prompt(context: str, category: str, phase: str, history: list = None, last_answer: str = None) -> str:
        history_str = ""
        if history:
            for item in history:
                history_str += f"AI Question: {item.get('question')}\nUser Answer: {item.get('answer')}\n"
                
        if phase == "generate_question":
            return f"""You are conducting a simulated mock interview with the user.
Interview Type: {category} (HR, Technical, or Manager)
User Context:
{context}

Past conversation:
{history_str}

Generate the next realistic and challenging interview question based on the user's background/skills and the interview category.
Output ONLY the question itself, nothing else.
"""
        elif phase == "evaluate":
            return f"""Analyze the user's answer to the last interview question.
User Context:
{context}

AI Question: {history[-1].get('question') if history else "Question"}
User Answer: {last_answer}

Provide feedback on the user's answer:
1. Technical correctness or suitability for the role.
2. Strengths of the answer.
3. Specific improvement suggestions.
4. An objective score from 0 to 100.

Return the response in JSON format matching this structure:
{{
  "feedback": "Your detailed feedback paragraph...",
  "suggestions": ["suggestion 1", "suggestion 2"],
  "score": 85
}}
"""
        return ""

    @staticmethod
    def build_resume_insight_prompt(context: str) -> str:
        return f"""Analyze the following candidate profile context carefully:
{context}

Extract and structure the following insights based ONLY on the provided context. Follow these strict guidelines:
- ENTERPRISE-QUALITY ACCURACY: Do NOT assume, extrapolate, or hallucinate. If a piece of information is not present or cannot be inferred with absolute certainty from the context, return an empty array `[]` or an empty string `""` for that field. Do NOT invent or make up placeholders.
- CATEGORIZED SKILLS: Carefully isolate technical skills into their respective buckets: Programming Languages, Frameworks, Tools, and Soft Skills.

Extract and return the insights in JSON format matching this exact schema structure:
{{
  "skills": {{
    "programming_languages": ["Language 1", "Language 2"],
    "frameworks": ["Framework 1", "Framework 2"],
    "tools": ["Tool 1", "Tool 2"],
    "soft_skills": ["Soft Skill 1", "Soft Skill 2"]
  }},
  "projects": [
     {{
       "name": "Project Name",
       "description": "Brief, clear description of the project, including the candidate's contribution and technologies used."
     }}
  ],
  "strengths": [
     "Detailed strength statement with context from the profile",
     "Another detailed strength statement"
  ],
  "weaknesses": [
     "Constructive area of development based on context",
     "Another constructive area of development"
  ],
  "experience_summary": "A concise paragraph summarizing work history, academic background, and core achievements.",
  "suggested_roles": [
     "Suggested Job Title 1",
     "Suggested Job Title 2"
  ],
  "certifications": [
     "Certification Name (Issuer, Year if available)",
     "Another Certification"
  ],
  "education": [
     "Degree Name, Major - Institution Name (Year if available)",
     "Another Education Entry"
  ],
  "achievements": [
     "Specific quantified achievement or key milestone",
     "Another key achievement"
  ]
}}

Ensure the output contains ONLY the JSON block. Do not prepend or append any conversational text, explanations, or notes.
"""

    @staticmethod
    def build_career_prompt(context: str) -> str:
        return f"""Analyze the candidate profile context below and develop a highly detailed, professional Career Recommendation Report.
CONTEXT (Candidate Profile):
{context}

GUIDELINES:
1. You act as an experienced executive recruiter and career mentor. Keep recommendations highly specific and personalized to the candidate's actual projects, skills, and background.
2. DO NOT hallucinate. Do not invent projects, skills, or achievements. If a piece of information is missing, clearly output "Not found in uploaded profile."
3. Formatting: Return clean Markdown. Use headings, bullet points, and tables. Avoid long paragraphs.

REQUIRED SECTIONS:

### 1. Candidate Profile Summary
Provide a professional summary of the candidate's background, current status, and career trajectory based only on context.

### 2. Strengths
List at least 3-5 core strengths found in their profile with contextual proof.

### 3. Recommended Career Roles
Identify the top 5 career roles matching the candidate's profile, ranked from best to worst match. Format as a table or clean list containing:
- **Role Name**
- **Match Score (0-100%)**
- **Justification**: Why this role suits them.
- **Supporting Projects**: Project names from context that support this.
- **Supporting Skills**: Skills from context that support this.
- **Supporting Certifications**: Certifications from context that support this.

### 4. Skill Gap Analysis
Examine what is missing for the recommended roles. Detail:
- **Missing Technologies**
- **Missing Frameworks**
- **Missing Tools**
- **Missing Certifications**
- **Missing Soft Skills**

### 5. Personalized Learning Roadmap
Provide a realistic milestone growth roadmap:
- **30-Day Plan**
- **90-Day Plan**
- **6-Month Plan**
- **1-Year Growth Plan**

### 6. Industry Readiness
Rate each index from 0 to 100% and provide a clear explanation:
| Readiness Area | Score | Explanation / Justification |
| :--- | :--- | :--- |
| **Placement Readiness** | Score% | Reason |
| **Interview Readiness** | Score% | Reason |
| **Portfolio Strength** | Score% | Reason |
| **Resume Strength** | Score% | Reason |
| **Communication Readiness** | Score% | Reason |

### 7. Suggested Projects
Recommend exactly 3 projects the candidate should build next to bridge their skill gaps. Explain:
- **Project Concept**
- **Technologies to Use**
- **Why Recommended**

### 8. Interview Preparation
Provide guidance for upcoming interviews:
- **Top Technical Topics**
- **Top HR Topics**
- **Most Expected Interview Questions** (At least 3 questions)
- **Areas Needing Practice**

### 9. Final Recommendation
- **Immediate Next Steps**: Provide exactly 5 actionable items prioritized from highest impact to lowest.
"""

    @staticmethod
    def build_achievement_prompt(context: str, platform: str) -> str:
        p_type = platform.lower().strip()
        
        prompt_details = ""
        if "linkedin" in p_type:
            prompt_details = """Generate the following sections in clean Markdown:
- **Professional Headline**: A catchy, high-impact headline.
- **About Section**: An engaging summary of career, passions, and background (1-2 short paragraphs).
- **Career Objective**: Future goals.
- **Skills Summary**: Categorized key skills found in the profile.
- **Professional Closing**: Call to action or closing remark.
Speak in the first person ("I")."""
        elif "resume" in p_type:
            prompt_details = """Generate the following sections in clean Markdown:
- **Resume Summary**: A 4-6 line ATS-friendly summary outlining key experience, tech stack, and achievements.
- **Technical Strengths**: Key technical areas of expertise.
- **Experience Summary**: Overview of candidate's background.
- **Career Objective**: Bullet point objective.
Speak in the third person or bullet format as standard for resumes."""
        elif "portfolio" in p_type:
            prompt_details = """Generate the following sections in clean Markdown:
- **Portfolio Introduction**: Catchy greeting and tagline.
- **Professional Overview**: Narrative introduction to candidate.
- **Technical Expertise**: Core tools and technologies.
- **Projects Overview**: Highlight projects from the context.
- **Career Interests**: Core focus areas.
Speak in the first person ("I")."""
        elif "bio" in p_type:
            prompt_details = """Generate three versions in clean Markdown:
- **Short Bio**: Approximately 50 words.
- **Medium Bio**: Approximately 100 words.
- **Long Bio**: Approximately 200 words.
Speak in the first or third person depending on context, keeping it highly professional."""
        else:
            prompt_details = f"Generate professional branding copy matching the requested platform: {platform}."

        return f"""Analyze the candidate profile context below and generate professional branding copy.
CONTEXT (Candidate Profile):
{context}

PLATFORM: {platform}
INSTRUCTIONS:
{prompt_details}

CRITICAL RULES:
- DO NOT hallucinate, invent, or extrapolate projects, skills, certifications, experience, or metrics (e.g. CGPA, years of experience, specific scores).
- If any required information is missing or not present in the context, write exactly "Not found in uploaded profile." instead of inventing.
- Output clean Markdown using headings, spacing, and bullet points. Avoid large walls of text.
"""
