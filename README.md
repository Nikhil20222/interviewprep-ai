# InterviewPrep AI

I made this project because before applying for internships I always ended up using different websites.

One website for ATS score.

Another website for resume analysis.

Then ChatGPT for improving my resume.

And again ChatGPT for interview practice.

I wanted everything in one place, so I started building InterviewPrep AI.

---

# Why?

The idea was pretty simple.

Upload a resume, understand what's good and what's missing, compare it with a job description, and finally practice a mock interview before actually applying.

Instead of switching between multiple websites, I wanted one tool that could do all of this.

---

# What it does

### Resume Analysis

- Upload PDF, DOCX or TXT resumes
- Resume preview with extracted information
- Resume quality analysis
- ATS compatibility report
- AI suggestions for improving the resume

### Resume vs Job Description

- Upload a Job Description
- Compare resume with the JD
- Match percentage
- Missing skills
- Keyword analysis
- Suggestions to improve the resume for that role

### Mock Interview

- Generates interview questions using both the resume and the Job Description
- Interview session page
- AI feedback after answering
- Overall interview review and score

---

# Tech Stack

Frontend

- HTML
- CSS
- Vanilla JavaScript

Backend

- Flask

AI

- Groq
- Gemini
- OpenRouter

Deployment

- Vercel

I kept the stack simple because I wanted to understand everything instead of depending on frameworks.

---

# How it works

The user uploads a resume.

The backend extracts the text and sends it to the AI.

The AI generates resume analysis, ATS checks and suggestions.

If a Job Description is uploaded, the application compares both documents and finds missing skills and keyword matches.

Finally, the user can start a mock interview where questions are generated using both the resume and the Job Description.

After answering the questions, the AI reviews the answers and gives feedback.

---

# Challenges I faced

This project looked much easier before I started building it.

Some things that took much longer than I expected:

- Different resume formats don't always extract text properly.
- AI models don't always return JSON in the same format, so parsing responses took quite a bit of debugging.
- Making ATS scores feel useful instead of returning random numbers.
- Connecting resume analysis, JD matching and mock interviews without breaking the previous features.
- After redesigning the frontend I had to reconnect almost every backend route again.
- Testing lots of different resumes because every resume is structured differently.
- Making sure the interview questions actually use both the resume and the Job Description instead of asking generic questions.

Honestly, I probably spent more time debugging than writing new features.

---

# What I learned

Building this project taught me a lot.

Some of the biggest things I learned were:

- Working with Flask
- Resume parsing
- Prompt engineering
- Connecting multiple AI providers
- Handling inconsistent AI responses
- Better frontend and backend communication
- Debugging real projects instead of small tutorial examples

---

# Running locally

Clone the repository

```bash
git clone https://github.com/yourusername/interviewprep-ai.git

cd interviewprep-ai
```

Install dependencies

```bash
pip install -r requirements.txt
```

Create a `.env` file

```env
AI_PROVIDER=groq
GROQ_API_KEY=your_api_key
```

Run the application

```bash
python app.py
```

Open

```
http://localhost:5000
```

---

# Future Improvements

Some ideas I want to add later:

- Voice interviews
- Download interview reports
- Interview history
- Better interview scoring
- More AI providers
- User accounts

---

# Screenshots

<img width="1912" height="876" alt="sd" src="https://github.com/user-attachments/assets/a78cf2c3-f1d0-4924-9793-e81d0bbd412f" />
<img width="1917" height="906" alt="image" src="https://github.com/user-attachments/assets/554941d5-b87d-4c44-9373-8c8357848deb" />
<img width="1917" height="907" alt="image" src="https://github.com/user-attachments/assets/65cb2f74-a3b6-41b8-a3a9-aa6c8221b40e" />



# Final Thoughts

InterviewPrep AI started as a simple resume analyzer.

Then I added Job Description matching.

After that I built the mock interview system.

It slowly became a complete interview preparation tool instead of just another AI wrapper.

There are still many things I want to improve, but I'm happy with how the project has turned out and I learned a lot while building it.
