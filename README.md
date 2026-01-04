# 🎓 QuizGen AI - Transform Your Notes into Quizzes

**QuizGen AI** is a modern, high-performance web application that leverages the power of Google Gemini AI to transform your study notes, slides, or PDF documents into interactive multiple-choice quizzes. Perfect for students, teachers, and life-long learners.

---

## ✨ Features

- **🤖 AI-Powered Generation**: Uses Google's `Gemini 1.5/2.5 Flash` models.
- **🔐 Secure Secrets**: API keys and IDs are managed via `.env` files (Internal mode).
- **📄 PDF Support**: Upload your PDF lecture notes directly.
- **⚙️ Configurable Quizzes**: Choose to generate **5, 10, 15, or 20 questions**.
- **📊 Dynamic Analytics**: Live feedback and circular score gauge.
- **📩 Feedback Integration**: `Formspree` support for user feedback.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, ES6+ JavaScript.
- **AI Engine**: Google Gemini API Gateway.
- **PDF Extraction**: PDF.js (CDN).
- **Communication**: Formspree API (for feedback).
- **Deployment**: Netlify ready.

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- A **Google Gemini API Key**: Get one for free at [Google AI Studio](https://aistudio.google.com/).
- (Optional) A **Formspree ID**: Get one at [Formspree.io](https://formspree.io/).

### 2. Configuration
1. Create a `.env` file in the root directory (you can copy `.env.example`).
2. Add your secrets:
```env
VITE_GEMINI_API_KEY=your_key_here
VITE_FORMSPREE_ID=your_id_here
```

### 3. Setup & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
Open the provided local URL (usually [http://localhost:5173](http://localhost:5173)) in your browser.

### 3. Usage
1. Open the application.
2. Select the **Number of Questions** you want.
3. Upload a `.pdf`, `.txt`, or `.md` file, or paste your text directly.
4. Click **Generate Quiz** and start learning!

---

## ☁️ Deployment

### Netlify (Recommended)
This project is pre-configured with a `netlify.toml` file.

1. **Netlify Drop**: Drag and drop the project folder onto [Netlify Drop](https://app.netlify.com/drop).
2. **Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=.
   ```
3. **GitHub Integration**: Push this project to GitHub and connect it to Netlify for automatic deployments on every commit.

---

## 📝 License
Built with ❤️ for better learning. Feel free to use and improve this project!
