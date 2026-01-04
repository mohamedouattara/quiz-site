document.addEventListener('DOMContentLoaded', () => {
    // PDF.js Worker
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    // Elements
    const sections = {
        upload: document.getElementById('upload-section'),
        loading: document.getElementById('loading-section'),
        quiz: document.getElementById('quiz-section'),
        results: document.getElementById('results-section')
    };

    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const generateBtn = document.getElementById('generate-btn');
    const textPaste = document.getElementById('text-paste');
    const questionContainer = document.getElementById('question-container');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');
    const questionCountText = document.getElementById('question-count');
    const finalScoreText = document.getElementById('final-score');
    const correctCountText = document.getElementById('correct-count');
    const incorrectCountText = document.getElementById('incorrect-count');
    const reviewList = document.getElementById('review-list');

    // State
    let currentQuiz = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let userAnswers = [];
    let timerInterval;
    let secondsElapsed = 0;

    // --- Navigation ---
    function showSection(name) {
        Object.values(sections).forEach(s => s.classList.remove('active'));
        sections[name].classList.add('active');
        window.scrollTo(0, 0);
    }

    // --- File Handling ---
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFile(files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    async function handleFile(file) {
        if (file.type === 'application/pdf') {
            try {
                textPaste.value = 'Extracting text from PDF... Please wait.';
                generateBtn.disabled = true;
                const text = await extractTextFromPDF(file);
                textPaste.value = text;
                generateBtn.disabled = false;
            } catch (error) {
                console.error('PDF Error:', error);
                alert('Error reading PDF file: ' + error.message);
                textPaste.value = '';
                generateBtn.disabled = false;
            }
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                textPaste.value = e.target.result;
            };
            reader.readAsText(file);
        }
    }

    async function extractTextFromPDF(file) {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => item.str);
            fullText += strings.join(' ') + '\n';
        }
        return fullText;
    }

    // --- Quiz Generation (Gemini AI) ---
    generateBtn.addEventListener('click', async () => {
        const content = textPaste.value.trim();
        const apiKey = document.getElementById('api-key').value.trim();

        if (!content) {
            alert('Please provide some notes first!');
            return;
        }

        if (!apiKey) {
            alert('Please enter your Gemini API Key. You can get a free one from Google AI Studio.');
            return;
        }

        showSection('loading');

        try {
            currentQuiz = await generateQuizWithGemini(content, apiKey);
            if (currentQuiz.length === 0) {
                throw new Error("No questions generated.");
            }
            startQuiz();
        } catch (error) {
            console.error(error);
            alert("Error generating quiz: " + error.message);
            showSection('upload');
        }
    });

    async function generateQuizWithGemini(text, apiKey) {
        // v1 is the stable version and supports gemini-1.5-flash
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent`;

        const prompt = `
            You are a Quiz Generator specialized in study materials. 
            Analyze the input text below and generate a quiz with exactly 5 multiple-choice questions.
            Return ONLY a valid JSON array of objects. Do not include markdown formatting or explanations.
            
            JSON Structure:
            [
              {
                "question": "The question text",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                "correct": 0
              }
            ]

            Input text:
            ${text}
        `;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });

            if (!response.ok) {
                let errorMsg = `HTTP Error ${response.status}`;
                try {
                    const errData = await response.json();
                    errorMsg = errData.error?.message || errorMsg;
                } catch (e) { /* ignore non-json errors */ }

                console.error('Gemini API Error:', errorMsg);
                throw new Error(errorMsg);
            }

            const data = await response.json();

            if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
                throw new Error("No candidates returned from AI. This may be due to safety filters.");
            }

            let genText = data.candidates[0].content.parts[0].text;

            // Robustly extract the JSON array from the response
            const jsonStart = genText.indexOf('[');
            const jsonEnd = genText.lastIndexOf(']');

            if (jsonStart !== -1 && jsonEnd !== -1) {
                genText = genText.substring(jsonStart, jsonEnd + 1);
            }

            try {
                return JSON.parse(genText);
            } catch (e) {
                console.error("Failed to parse AI response:", genText);
                throw new Error("The AI returned an invalid response format. Please try again.");
            }
        } catch (err) {
            if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
                throw new Error("Network error: Could not reach Gemini API.");
            }
            throw err;
        }
    }

    // --- Quiz Logic ---
    function startQuiz() {
        currentQuestionIndex = 0;
        score = 0;
        userAnswers = [];
        secondsElapsed = 0;
        startTimer();
        showQuestion();
        showSection('quiz');
    }

    function startTimer() {
        const timerText = document.getElementById('timer');
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            secondsElapsed++;
            const mins = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
            const secs = (secondsElapsed % 60).toString().padStart(2, '0');
            timerText.textContent = `${mins}:${secs}`;
        }, 1000);
    }

    function showQuestion() {
        const q = currentQuiz[currentQuestionIndex];
        questionCountText.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuiz.length}`;
        progressBar.style.width = `${((currentQuestionIndex) / currentQuiz.length) * 100}%`;

        questionContainer.innerHTML = `
            <h2>${q.question}</h2>
            <div class="options-grid">
                ${q.options.map((opt, i) => `
                    <div class="option" data-index="${i}">
                        <div class="option-letter">${String.fromCharCode(65 + i)}</div>
                        <div class="option-text">${opt}</div>
                    </div>
                `).join('')}
            </div>
        `;

        document.querySelectorAll('.option').forEach(opt => {
            opt.addEventListener('click', selectOption);
        });

        nextBtn.disabled = true;
    }

    function selectOption(e) {
        const selectedIdx = parseInt(e.currentTarget.dataset.index);
        const q = currentQuiz[currentQuestionIndex];

        // Remove previous selection
        document.querySelectorAll('.option').forEach(o => o.classList.remove('selected', 'correct', 'incorrect'));

        e.currentTarget.classList.add('selected');

        // Instant feedback
        const allOptions = document.querySelectorAll('.option');
        if (selectedIdx === q.correct) {
            e.currentTarget.classList.add('correct');
        } else {
            e.currentTarget.classList.add('incorrect');
            allOptions[q.correct].classList.add('correct');
        }

        // Disable further clicking
        allOptions.forEach(o => o.style.pointerEvents = 'none');

        userAnswers[currentQuestionIndex] = selectedIdx;
        nextBtn.disabled = false;

        if (selectedIdx === q.correct) score++;
    }

    nextBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuiz.length) {
            showQuestion();
        } else {
            showResults();
        }
    });

    // --- Results Logic ---
    function showResults() {
        clearInterval(timerInterval);
        progressBar.style.width = '100%';
        const percent = Math.round((score / currentQuiz.length) * 100);
        finalScoreText.textContent = percent;
        correctCountText.textContent = score;
        incorrectCountText.textContent = currentQuiz.length - score;

        generateReview();
        showSection('results');
    }

    function generateReview() {
        reviewList.innerHTML = '';
        currentQuiz.forEach((q, i) => {
            const isCorrect = userAnswers[i] === q.correct;
            const reviewItem = document.createElement('div');
            reviewItem.className = `review-item ${isCorrect ? 'right' : 'wrong'}`;

            reviewItem.innerHTML = `
                <p>${i + 1}. ${q.question}</p>
                <div class="answer-info">
                    <span class="text-success">Correct answer: ${q.options[q.correct]}</span>
                    ${!isCorrect ? `<br><span class="text-danger">Your answer: ${q.options[userAnswers[i]]}</span>` : ''}
                </div>
            `;
            reviewList.appendChild(reviewItem);
        });
    }

    // --- Feedback Handling ---
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackSuccess = document.getElementById('feedback-success');

    if (feedbackForm) {
        feedbackForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // In a real app, you would send this to a server
            const email = document.getElementById('feedback-email').value;
            const message = document.getElementById('feedback-msg').value;

            console.log('Feedback received:', { email, message });

            // Simulate success
            feedbackForm.style.display = 'none';
            feedbackSuccess.style.display = 'block';

            // Optional: Use Formspree or similar for real emails
            // fetch('https://formspree.io/f/your-id', { ... })
        });
    }
});
