# QuizGen AI 🧠✨

**QuizGen AI** is a premium, AI-powered learning platform that transforms your study materials into interactive, gamified quizzes. Whether you have PDF notes, textbook scans, or online articles, our tool helps you master any subject with ease.

## 🚀 Key Features

- **Multi-Source Support**: Generate quizzes from Text, PDFs, Images/Scans, or directly from a Website URL.
- **Gamified Experience**: Earn XP, level up your profile, and maintain daily streaks (🔥).
- **Multi-Profile System**: Separate progress, stats, and recommendations for different users or subjects.
- **Interactive References**: Every answer comes with a pedagogical reference/explanation shown as a glassmorphism tooltip.
- **Language Support**: Generate quizzes in French, English, Spanish, Arabic, and more.
- **Flexible Controls**: Skip questions, adjust question counts, and permanently delete recommendation tags.

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Glassmorphism), JavaScript (ES6+).
- **AI Engine**: Google Gemini 2.5 Flash.
- **Tools**: Vite, PDF.js, Formspree (Feedback), r.jina.ai (URL Parsing).

## 📦 Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd "Quiz site"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_FORMSPREE_ID=your_formspree_id_here
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 🏗️ Build & Production

To generate an optimized production build:
```bash
npm run build
```
To preview the production build locally:
```bash
npm run preview
```

## 📖 How It Works

1. **Choose Content**: Upload a file, scan an image, or paste a link.
2. **AI Analysis**: Our AI extracts concepts and generates MCQs with references.
3. **Quiz Time**: Test your knowledge and learn from instant feedback.
4. **Progress**: Save your identity, earn XP, and level up!

## ⚠️ Data & Privacy
All progress (profiles, XP, history) is stored **locally** in your browser. Use the "Reset All Data" button in the profile settings if you wish to clear your footprint.

---
*Crafted with ❤️ for better learning.*
