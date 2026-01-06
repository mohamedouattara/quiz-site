console.log('app.js: Script loading started');

// Global Error Handler for debugging
window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.error('Global Error caught:', msg, 'at', lineNo, ':', columnNo);
    alert('Error: ' + msg + '\nLine: ' + lineNo);
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('app.js: DOMContentLoaded reached');
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
    const languageSelect = document.getElementById('language-select');
    const recommendationsContainer = document.getElementById('recommendations');
    const chipsWrapper = document.getElementById('chips-wrapper');
    const typeBtns = document.querySelectorAll('.type-btn');
    const imageInput = document.getElementById('image-input');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeImgBtn = document.getElementById('remove-img-btn');
    const browseBtn = document.getElementById('browse-btn');
    const uploadTitle = document.getElementById('upload-title');
    const uploadSubtitle = document.getElementById('upload-subtitle');
    const textInputContainer = document.getElementById('text-input-container');
    const urlInputContainer = document.getElementById('url-input-container');
    const urlInput = document.getElementById('url-input');
    const skipBtn = document.getElementById('skip-btn');
    const skippedCountText = document.getElementById('skipped-count');

    // State
    let currentQuiz = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let userAnswers = [];
    let timerInterval;
    let secondsElapsed = 0;
    let quizType = 'text'; // 'text' or 'image'
    let selectedImageBase64 = null;

    const addProfileBtn = document.getElementById('add-profile-btn');
    const resetAllBtn = document.getElementById('reset-all-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const profileModal = document.getElementById('profile-modal');
    const modalProfileList = document.getElementById('modal-profile-list');
    const playerProfileBtn = document.getElementById('player-profile');

    // Gamification & Multi-Profile State
    let playerProfiles = [];
    let activeProfileIndex = 0;

    const defaultStats = () => ({
        username: null,
        xp: 0,
        level: 1,
        streak: 0,
        lastDate: null,
        topics: []
    });

    // --- Navigation & UI Handlers ---
    function showSection(name) {
        Object.values(sections).forEach(s => s.classList.remove('active'));
        sections[name].classList.add('active');
        window.scrollTo(0, 0);
    }

    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            quizType = btn.dataset.type;
            updateUploadUI();
        });
    });

    function updateUploadUI() {
        if (quizType === 'image') {
            uploadTitle.textContent = 'Upload your Image or Scan';
            uploadSubtitle.textContent = 'Supports JPG, PNG, WEBP';
            textInputContainer.style.display = 'none';
            dropZone.style.display = 'block';
            urlInputContainer.style.display = 'none';
        } else if (quizType === 'url') {
            uploadTitle.textContent = 'Generate from URL';
            uploadSubtitle.textContent = 'Enter the link to a webpage or article';
            textInputContainer.style.display = 'none';
            dropZone.style.display = 'none';
            urlInputContainer.style.display = 'block';
        } else {
            uploadTitle.textContent = 'Drag & drop your notes here';
            uploadSubtitle.textContent = 'Supports .txt, .md, .pdf or paste your text below';
            textInputContainer.style.display = 'block';
            dropZone.style.display = 'block';
            urlInputContainer.style.display = 'none';
        }
    }

    browseBtn.addEventListener('click', () => {
        if (quizType === 'image') {
            imageInput.click();
        } else {
            fileInput.click();
        }
    });

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

    // --- Multi-Profile Logic ---
    function generateRandomName() {
        const adjectives = ['Quantum', 'Cyber', 'Atomic', 'Prismatic', 'Digital', 'Logic', 'Hyper', 'Nova', 'Cerebral', 'Infinite'];
        const nouns = ['Scholar', 'Explorer', 'Sage', 'Architect', 'Alchemist', 'Pioneer', 'Wiz', 'Master', 'Seeker', 'Mind'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${adj} ${noun}`;
    }

    function createNewProfile() {
        const newProfile = defaultStats();
        newProfile.username = generateRandomName();
        playerProfiles.push(newProfile);
        activeProfileIndex = playerProfiles.length - 1;
        saveAllData();
        updateStatsUI();
        renderRecommendations();
        renderProfileList();
    }

    function switchProfile(index) {
        activeProfileIndex = index;
        saveAllData();
        updateStatsUI();
        renderRecommendations();
        renderProfileList();
        profileModal.classList.remove('active');
    }

    function loadAllData() {
        const savedProfiles = localStorage.getItem('quiz_player_profiles');
        const savedActive = localStorage.getItem('quiz_active_profile_idx');

        if (savedProfiles) {
            playerProfiles = JSON.parse(savedProfiles);
            activeProfileIndex = parseInt(savedActive) || 0;
        } else {
            // First time migration or new user
            const legacyStats = localStorage.getItem('quiz_user_stats');
            const legacyTopics = JSON.parse(localStorage.getItem('quiz_topics') || '[]');

            if (legacyStats) {
                const stats = JSON.parse(legacyStats);
                stats.topics = legacyTopics;
                playerProfiles = [stats];
            } else {
                const initial = defaultStats();
                initial.username = generateRandomName();
                playerProfiles = [initial];
            }
            activeProfileIndex = 0;
        }

        checkStreak();
        updateStatsUI();
        renderRecommendations();
    }

    function saveAllData() {
        localStorage.setItem('quiz_player_profiles', JSON.stringify(playerProfiles));
        localStorage.setItem('quiz_active_profile_idx', activeProfileIndex);
    }

    function getActiveProfile() {
        return playerProfiles[activeProfileIndex];
    }

    function checkStreak() {
        const profile = getActiveProfile();
        if (!profile) return;
        const today = new Date().toDateString();
        if (profile.lastDate === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (profile.lastDate === yesterdayStr) {
            profile.streak++;
        } else {
            profile.streak = 1;
        }

        profile.lastDate = today;
        saveAllData();
    }

    function awardXP(amount) {
        const profile = getActiveProfile();
        if (!profile) return;
        profile.xp += amount;
        profile.level = Math.floor(profile.xp / 100) + 1;
        saveAllData();
        updateStatsUI();
    }

    function updateStatsUI() {
        const profile = getActiveProfile();
        if (!profile) return;

        const elements = {
            streak: document.getElementById('nav-streak'),
            level: document.getElementById('nav-level'),
            xpVal: document.getElementById('nav-xp-val'),
            xpBar: document.getElementById('nav-xp-bar'),
            name: document.getElementById('player-name')
        };

        const currentLevelXp = profile.xp % 100;
        if (elements.streak) elements.streak.textContent = profile.streak;
        if (elements.level) elements.level.textContent = profile.level;
        if (elements.xpVal) elements.xpVal.textContent = currentLevelXp;
        if (elements.xpBar) elements.xpBar.style.width = `${currentLevelXp}%`;
        if (elements.name) elements.name.textContent = profile.username;
    }

    function renderProfileList() {
        modalProfileList.innerHTML = playerProfiles.map((p, i) => `
            <div class="profile-item ${i === activeProfileIndex ? 'active' : ''}" data-index="${i}">
                <div class="avatar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 1rem;">${p.username}</div>
                    <div style="font-size: 0.8rem; color: var(--text-dim);">Niveau ${p.level} • ${p.xp} XP</div>
                </div>
                ${i === activeProfileIndex ? '<span class="text-success" style="font-size: 0.8rem;">Actif</span>' : ''}
            </div>
        `).join('');

        modalProfileList.querySelectorAll('.profile-item').forEach(item => {
            item.onclick = () => switchProfile(parseInt(item.dataset.index));
        });
    }

    function resetAllData() {
        if (confirm("⚠️ Êtes-vous sûr de vouloir supprimer TOUTES les données ? Cette action supprimera tous les profils, votre progression et vos recommandations. C'est irréversible.")) {
            if (confirm("Dernière chance : Souhaitez-vous vraiment tout réinitialiser ?")) {
                localStorage.clear();
                window.location.reload();
            }
        }
    }

    // Modal Events
    if (playerProfileBtn) {
        playerProfileBtn.onclick = () => {
            renderProfileList();
            profileModal.classList.add('active');
        };
    }
    if (closeModalBtn) closeModalBtn.onclick = () => profileModal.classList.remove('active');
    if (addProfileBtn) addProfileBtn.onclick = createNewProfile;
    if (resetAllBtn) resetAllBtn.onclick = resetAllData;

    // Navigation fix for "How it works" link
    const howItWorksLink = document.querySelector('a[href="#how-it-works"]');
    if (howItWorksLink) {
        howItWorksLink.onclick = (e) => {
            if (activeSection !== 'upload') {
                showSection('upload');
                // Small delay to allow display:block before scrolling
                setTimeout(() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        };
    }

    loadAllData();

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleImage(e.target.files[0]);
    });

    removeImgBtn.addEventListener('click', () => {
        selectedImageBase64 = null;
        imagePreviewContainer.style.display = 'none';
        imageInput.value = '';
    });

    function handleImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            selectedImageBase64 = e.target.result;
            imagePreview.src = selectedImageBase64;
            imagePreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

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

    async function handleUrl(url) {
        try {
            // Use r.jina.ai to get clean markdown from URL
            const response = await fetch(`https://r.jina.ai/${url}`);
            if (!response.ok) throw new Error('Failed to fetch URL content');
            const text = await response.text();
            return text;
        } catch (error) {
            console.error('URL Fetch Error:', error);
            throw new Error('Could not read the URL. Please make sure the link is public.');
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
        console.log('Generate Quiz button clicked, type:', quizType);

        let content = "";

        // Validation and Content Preparation
        if (quizType === 'text') {
            content = textPaste.value.trim();
            if (!content) {
                alert('Please provide some notes or paste text first!');
                return;
            }
        } else if (quizType === 'image') {
            if (!selectedImageBase64) {
                alert('Please upload an image or scan first!');
                return;
            }
            content = "Analyze the provided image."; // Placeholder for image mode
        } else if (quizType === 'url') {
            const urlValue = urlInput.value.trim();
            if (!urlValue) {
                alert('Please enter a website URL!');
                return;
            }
            showSection('loading');
            try {
                content = await handleUrl(urlValue);
            } catch (err) {
                showSection('upload');
                alert(err.message);
                return;
            }
        }

        // Safer environment variable access
        let apiKey = '';
        try {
            apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        } catch (e) {
            console.warn('Vite environment variables not available. Falling back to UI check.');
        }

        if (!apiKey) {
            apiKey = document.getElementById('api-key')?.value.trim();
        }

        if (!apiKey) {
            alert('Gemini API Key is missing. Please check your .env file or the configuration.');
            if (quizType === 'url') showSection('upload');
            return;
        }

        if (quizType !== 'url') showSection('loading');

        try {
            currentQuiz = await generateQuizWithGemini(content, apiKey);
            if (!currentQuiz || currentQuiz.length === 0) {
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
        const questionCount = document.getElementById('question-count-select').value || 5;
        const language = languageSelect.value || 'French';

        // Using Gemimi 2.5 Flash on stable v1 endpoint as requested
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent`;

        const prompt = `
            You are a Quiz Generator specialized in study materials. 
            ${quizType === 'image' ? 'Analyze the attached image.' : 'Analyze the input text below.'}
            Generate a quiz with exactly ${questionCount} multiple-choice questions.
            The language of the quiz (questions, options, explanations and title) MUST be ${language}.
            Include a "reference" or "explanation" for each question to legitimize the answer.
            IMPORTANT: Return ONLY raw JSON. No conversational text.
            Properly escape all strings. Do NOT use unescaped newlines within JSON values.
            
            JSON Structure:
            {
              "quiz_title": "Concise title",
              "questions": [
                {
                  "question": "text",
                  "options": ["A", "B", "C", "D"],
                  "correct": 0,
                  "explanation": "reference"
                }
              ]
            }

            ${quizType === 'text' ? 'Input text:\n' + text : 'Base your questions on the provided image.'}
        `;

        // Build the payload
        const payload = {
            contents: [{
                parts: [
                    { text: prompt }
                ]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048
            }
        };

        if (quizType === 'image' && selectedImageBase64) {
            // Extract mimetype and base64 data
            const match = selectedImageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
            if (match) {
                payload.contents[0].parts.push({
                    inline_data: {
                        mime_type: match[1],
                        data: match[2]
                    }
                });
            }
        }

        try {
            console.log('Sending request to Gemini API (Multimodal:', quizType === 'image', '):', url);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify(payload)
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
            console.log('Gemini Raw Response:', genText);

            // Robust JSON Extraction and Aggressive Sanitization
            function extractAndCleanJSON(text) {
                // 1. Remove markdown markers (case-insensitive)
                let clean = text.replace(/```(?:json)?/gi, "").trim();

                // 2. Surgical extraction of the outermost structure
                const firstBrace = clean.indexOf('{');
                const firstBracket = clean.indexOf('[');
                const lastBrace = clean.lastIndexOf('}');
                const lastBracket = clean.lastIndexOf(']');

                if (firstBrace === -1 && firstBracket === -1) {
                    throw new Error("The AI response did not contain a valid JSON structure.");
                }

                let start = -1;
                let end = -1;

                if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
                    start = firstBrace;
                    end = lastBrace;
                } else if (firstBracket !== -1) {
                    start = firstBracket;
                    end = lastBracket;
                }

                // If no closing symbol is found (truncated), take everything to the end
                if (start !== -1 && (end === -1 || end < start)) {
                    console.warn("JSON appears truncated, capturing partial structure...");
                    end = clean.length - 1;
                }

                if (start === -1) {
                    throw new Error("Could not isolate JSON structure.");
                }

                let jsonStr = clean.substring(start, end + 1).trim();

                // 3. AI Cleaning
                // Only replace things that are definitely wrong in JSON
                return jsonStr
                    .replace(/,\s*([\}\]])/g, '$1')             // Remove trailing commas
                    .replace(/([\}\]])\s*([\{\[])/g, '$1, $2')   // Add missing commas between objects/arrays (e.g., }{ -> },{)
                    .replace(/[\u201C\u201D\u2018\u2019]/g, '"'); // Normalize smart quotes to standard quotes
            }

            const finalJsonStr = extractAndCleanJSON(genText);

            try {
                let responseData;
                try {
                    responseData = JSON.parse(finalJsonStr);
                } catch (parseError) {
                    // JSON Auto-Repair: Try to close open braces/brackets if truncated
                    console.warn("Initial JSON parse failed, attempting auto-repair...");
                    let repaired = finalJsonStr;
                    const openBraces = (repaired.match(/\{/g) || []).length;
                    const closeBraces = (repaired.match(/\}/g) || []).length;
                    const openBrackets = (repaired.match(/\[/g) || []).length;
                    const closeBrackets = (repaired.match(/\]/g) || []).length;

                    for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
                    for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';

                    try {
                        responseData = JSON.parse(repaired);
                        console.log("Auto-repair successful!");
                    } catch (e2) {
                        throw parseError; // Rethrow original if repair fails
                    }
                }

                let quizData = [];
                let topic = "Quiz";

                if (!Array.isArray(responseData)) {
                    quizData = responseData.questions || [];
                    topic = responseData.quiz_title || quizData[0]?.question?.split(' ').slice(0, 8).join(' ') || "Quiz";
                } else {
                    quizData = responseData;
                    topic = quizData[0]?.question?.split(' ').slice(0, 8).join(' ') || "Quiz";
                }

                if (!quizData || quizData.length === 0) {
                    throw new Error("The AI returned an empty question list.");
                }

                saveTopic(topic);
                return quizData;
            } catch (e) {
                console.error("JSON Parse Error:", e);
                console.error("Failed string:", finalJsonStr);
                throw new Error(`AI format error: ${e.message}. Try reducing the question count if this persists.`);
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

    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            userAnswers[currentQuestionIndex] = null; // null signifies skip
            currentQuestionIndex++;
            if (currentQuestionIndex < currentQuiz.length) {
                showQuestion();
            } else {
                showResults();
            }
        });
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
        // Keep skipBtn enabled so user can change their mind or skip anyway
        if (skipBtn) skipBtn.disabled = false;

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

        const correct = score;
        const skipped = userAnswers.filter(a => a === null).length;
        const incorrect = currentQuiz.length - correct - skipped;

        const percent = Math.round((correct / currentQuiz.length) * 100);
        finalScoreText.textContent = percent;
        correctCountText.textContent = correct;
        incorrectCountText.textContent = incorrect;
        if (skippedCountText) {
            skippedCountText.textContent = skipped;
        }

        const resultMsg = document.getElementById('result-message');
        if (resultMsg) {
            resultMsg.textContent = getResultMessage(percent);
        }

        // Update CSS variable for the circular gauge
        const scoreCircle = document.querySelector('.score-circle');
        if (scoreCircle) {
            scoreCircle.style.setProperty('--score-percent', percent);
        }

        // Award XP
        const xpToAward = (correct * 10) + (percent === 100 ? 50 : 0);
        awardXP(xpToAward);

        generateReview();
        showSection('results');
    }

    function generateReview() {
        reviewList.innerHTML = '';
        currentQuiz.forEach((q, i) => {
            const userAnswer = userAnswers[i];
            const isSkipped = userAnswer === null;
            const isCorrect = userAnswer === q.correct;

            const reviewItem = document.createElement('div');
            let statusClass = 'wrong';
            if (isCorrect) statusClass = 'right';
            if (isSkipped) statusClass = 'skipped';
            reviewItem.className = `review-item ${statusClass}`;

            reviewItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <p style="margin: 0;">${i + 1}. ${q.question}</p>
                    ${q.explanation ? `<span class="info-icon" data-tooltip="${q.explanation.replace(/"/g, '&quot;')}">i</span>` : ''}
                </div>
                <div class="answer-info" style="margin-top: 0.5rem;">
                    <span class="text-success">Correct answer: ${q.options[q.correct]}</span><br>
                    ${isSkipped ? '<span style="color: var(--text-dim);">Skipped</span>' :
                    (!isCorrect ? `<span class="text-danger">Your answer: ${q.options[userAnswer]}</span>` : '')}
                </div>
            `;
            reviewList.appendChild(reviewItem);
        });
    }

    function getResultMessage(percent) {
        if (percent === 100) return "Perfect! You've mastered this topic! 🏆";
        if (percent >= 80) return "Impressive! You have a very strong grasp of these concepts. ✨";
        if (percent >= 60) return "Good job! You're on the right track, just a few things to polish. 👍";
        if (percent >= 40) return "Not bad, but there's room for improvement. Keep studying! 📚";
        return "Keep practicing! Review the explanations below to improve your score. 💪";
    }

    // --- Feedback Handling ---
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackSuccess = document.getElementById('feedback-success');

    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Feedback form submitted');

            // Safer environment variable access
            let formspreeId = '';
            try {
                formspreeId = import.meta.env.VITE_FORMSPREE_ID;
            } catch (e) {
                console.warn('Vite environment variables not available for Formspree.');
            }

            if (!formspreeId) {
                formspreeId = document.getElementById('formspree-id')?.value.trim();
            }

            const email = document.getElementById('feedback-email').value;
            const message = document.getElementById('feedback-msg').value;

            const submitBtn = feedbackForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            try {
                const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, message })
                });

                if (response.ok) {
                    feedbackForm.style.display = 'none';
                    feedbackSuccess.style.display = 'block';
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Formspree Error Status:', response.status);
                    console.error('Formspree Error Detail:', errorData);
                    throw new Error(`Failed to send feedback (Status: ${response.status})`);
                }
            } catch (err) {
                console.error('Feedback Submission Exception:', err);
                alert(`Error sending feedback: ${err.message}. Please check your Formspree ID in .env.`);
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // --- Recommendations Logic ---
    function saveTopic(topic) {
        if (!topic || topic.length < 3) return;
        const profile = getActiveProfile();
        if (!profile.topics) profile.topics = [];

        if (!profile.topics.includes(topic)) {
            profile.topics.unshift(topic);
            playerProfiles[activeProfileIndex].topics = profile.topics.slice(0, 6);
            saveAllData();
            renderRecommendations();
        }
    }

    function deleteTopic(topic) {
        const profile = getActiveProfile();
        profile.topics = profile.topics.filter(t => t !== topic);
        saveAllData();
        renderRecommendations();
    }

    function renderRecommendations() {
        const profile = getActiveProfile();
        const topics = profile?.topics || [];

        if (topics.length === 0) {
            recommendationsContainer.style.display = 'none';
            return;
        }

        recommendationsContainer.style.display = 'block';
        chipsWrapper.innerHTML = topics.map(topic => `
            <div class="chip" data-topic="${topic}">
                <span class="chip-text">${topic}</span>
                <span class="chip-delete" title="Supprimer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><line x1="18" y1="6" x2="6" y1="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </span>
            </div>
        `).join('');

        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const topic = chip.dataset.topic;

                if (e.target.closest('.chip-delete')) {
                    e.stopPropagation();
                    deleteTopic(topic);
                    return;
                }

                if (quizType === 'image') {
                    typeBtns[0].click();
                }
                textPaste.value = `Discuss the key concepts of: ${topic}`;
                textPaste.focus();
                textPaste.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });
    }

    // Initialize Recommendations differently now as it is profile dependent

    // Initial render
    renderRecommendations();
});
