// Configuration and Constants
const CONFIG = {
    REQUIRED_READINGS: 3,
    SCORE_THRESHOLDS: {
        EXCELLENT: 0.90,
        GOOD: 0.75,
        FAIR: 0.60
    },
    ANALYSIS_THRESHOLDS: {
        LOW_ACCURACY: 0.70,
        WORD_DIFF_RATIO: 0.25,
        SUBSTITUTION_RATIO: 0.50
    }
};

// Reference text (what users should read)
const REFERENCE_TEXT = "The quick brown fox jumps over the lazy dog near the riverbank. Technology helps us communicate better every day. Speech recognition has improved greatly over the past few years.";

// Application State
const state = {
    currentHeadset: null,
    currentEnvironment: null,
    currentReadings: [],
    allTests: [],
    isRecording: false,
    recognition: null
};

// DOM Elements
const elements = {
    headsetName: document.getElementById('headsetName'),
    environment: document.getElementById('environment'),
    recordButton: document.getElementById('recordButton'),
    recordingStatus: document.getElementById('recordingStatus'),
    recordingError: document.getElementById('recordingError'),
    setupError: document.getElementById('setupError'),
    progressText: document.getElementById('progressText'),
    progressFill: document.getElementById('progressFill'),
    resultsCard: document.getElementById('resultsCard'),
    currentHeadsetName: document.getElementById('currentHeadsetName'),
    averageScore: document.getElementById('averageScore'),
    readingsList: document.getElementById('readingsList'),
    newTestButton: document.getElementById('newTestButton'),
    comparisonCard: document.getElementById('comparisonCard'),
    comparisonTableBody: document.getElementById('comparisonTableBody'),
    browserWarning: document.getElementById('browserWarning')
};

// Initialize the application
function init() {
    checkBrowserSupport();
    setupEventListeners();
    updateRecordButtonState();
}

// Check if browser supports Web Speech API
function checkBrowserSupport() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        elements.browserWarning.style.display = 'block';
        elements.recordButton.disabled = true;
        return false;
    }

    return true;
}

// Setup all event listeners
function setupEventListeners() {
    elements.headsetName.addEventListener('input', handleSetupChange);
    elements.environment.addEventListener('change', handleSetupChange);
    elements.recordButton.addEventListener('click', handleRecordButtonClick);
    elements.newTestButton.addEventListener('click', handleNewTest);
}

// Handle setup field changes
function handleSetupChange() {
    clearError(elements.setupError);
    updateRecordButtonState();
}

// Update record button state based on setup completion
function updateRecordButtonState() {
    const headsetName = elements.headsetName.value.trim();
    const environment = elements.environment.value;
    const hasCompletedReadings = state.currentReadings.length >= CONFIG.REQUIRED_READINGS;

    elements.recordButton.disabled = !headsetName || !environment || hasCompletedReadings;
}

// Handle record button click
function handleRecordButtonClick() {
    if (state.isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

// Start recording
function startRecording() {
    // Validate setup
    const headsetName = elements.headsetName.value.trim();
    const environment = elements.environment.value;

    if (!headsetName) {
        showError(elements.setupError, 'Please enter a headset name');
        return;
    }

    if (!environment) {
        showError(elements.setupError, 'Please select an environment');
        return;
    }

    // Update state
    if (!state.currentHeadset) {
        state.currentHeadset = headsetName;
        state.currentEnvironment = environment;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    state.recognition = new SpeechRecognition();

    state.recognition.lang = 'en-US';
    state.recognition.continuous = false;
    state.recognition.interimResults = false;
    state.recognition.maxAlternatives = 1;

    // Setup recognition event handlers
    state.recognition.onstart = handleRecognitionStart;
    state.recognition.onresult = handleRecognitionResult;
    state.recognition.onerror = handleRecognitionError;
    state.recognition.onend = handleRecognitionEnd;

    // Start recognition
    try {
        state.recognition.start();
    } catch (error) {
        handleRecognitionError({ error: 'not-allowed', message: error.message });
    }
}

// Stop recording
function stopRecording() {
    if (state.recognition) {
        state.recognition.stop();
    }
}

// Handle recognition start
function handleRecognitionStart() {
    state.isRecording = true;
    updateRecordButtonUI(true);
    showStatus('Listening... Speak clearly into your microphone');
    clearError(elements.recordingError);
}

// Handle recognition result
function handleRecognitionResult(event) {
    const transcript = event.results[0][0].transcript;
    const confidence = event.results[0][0].confidence;

    // Calculate score and analysis
    const score = calculateScore(REFERENCE_TEXT, transcript);
    const analysis = analyzeIssues(REFERENCE_TEXT, transcript, score);
    const wordDiff = generateWordDiff(REFERENCE_TEXT, transcript);

    // Store reading
    const reading = {
        transcript: transcript,
        score: score,
        confidence: confidence,
        analysis: analysis,
        wordDiff: wordDiff,
        timestamp: new Date().toISOString()
    };

    state.currentReadings.push(reading);

    // Update UI
    updateProgress();
    showStatus(`Reading ${state.currentReadings.length} complete! Score: ${formatScore(score)}`);

    // Check if all readings are complete
    if (state.currentReadings.length >= CONFIG.REQUIRED_READINGS) {
        completeTest();
    }
}

// Handle recognition error
function handleRecognitionError(event) {
    let errorMessage = 'An error occurred. Please try again.';

    switch (event.error) {
        case 'not-allowed':
            errorMessage = 'Microphone access was denied. Please allow microphone access and try again.';
            break;
        case 'no-speech':
            errorMessage = 'No speech detected. Please try again and speak clearly.';
            break;
        case 'audio-capture':
            errorMessage = 'No microphone was found. Please connect a microphone and try again.';
            break;
        case 'network':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
    }

    showError(elements.recordingError, errorMessage);
}

// Handle recognition end
function handleRecognitionEnd() {
    state.isRecording = false;
    updateRecordButtonUI(false);
    state.recognition = null;
}

// Update record button UI
function updateRecordButtonUI(isRecording) {
    if (isRecording) {
        elements.recordButton.classList.add('recording');
        elements.recordButton.querySelector('.btn-text').textContent = 'Recording...';
        elements.recordButton.setAttribute('aria-label', 'Stop recording');
    } else {
        elements.recordButton.classList.remove('recording');
        elements.recordButton.querySelector('.btn-text').textContent = 'Start Recording';
        elements.recordButton.setAttribute('aria-label', 'Start recording');
        updateRecordButtonState();
    }
}

// Update progress display
function updateProgress() {
    const progress = state.currentReadings.length;
    const percentage = (progress / CONFIG.REQUIRED_READINGS) * 100;

    elements.progressText.textContent = `${progress} of ${CONFIG.REQUIRED_READINGS} readings complete`;
    elements.progressFill.style.width = `${percentage}%`;
}

// Complete the test
function completeTest() {
    // Save test results
    const test = {
        headset: state.currentHeadset,
        environment: state.currentEnvironment,
        readings: [...state.currentReadings],
        averageScore: calculateAverageScore(state.currentReadings),
        timestamp: new Date().toISOString()
    };

    state.allTests.push(test);

    // Display results
    displayResults(test);
    updateComparisonTable();

    // Show success message
    showStatus('Test complete! Scroll down to see your results.');
}

// Display results for current test
function displayResults(test) {
    elements.currentHeadsetName.textContent = test.headset;

    // Display average score
    const avgScore = test.averageScore;
    elements.averageScore.textContent = formatScore(avgScore);
    elements.averageScore.className = `score-value ${getScoreClass(avgScore)}`;

    // Display individual readings
    elements.readingsList.innerHTML = '';
    test.readings.forEach((reading, index) => {
        const readingElement = createReadingElement(reading, index + 1);
        elements.readingsList.appendChild(readingElement);
    });

    // Show results card
    elements.resultsCard.style.display = 'block';

    // Scroll to results
    setTimeout(() => {
        elements.resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// Create reading element
function createReadingElement(reading, number) {
    const div = document.createElement('div');
    div.className = 'reading-item';

    const score = reading.score;
    const scoreClass = getScoreClass(score);

    // Generate word diff HTML
    const wordDiffHtml = generateWordDiffHtml(reading.wordDiff);

    div.innerHTML = `
        <div class="reading-header">
            <span class="reading-number">Reading ${number}</span>
            <span class="reading-score ${scoreClass}">${formatScore(score)}</span>
        </div>
        <div class="reading-details">
            Confidence: ${Math.round(reading.confidence * 100)}%
        </div>
        ${reading.analysis ? `<div class="reading-issue">${reading.analysis}</div>` : ''}
        <div class="word-diff-container">
            <div class="word-diff-label">Word-by-word comparison:</div>
            <div class="word-diff">
                ${wordDiffHtml}
            </div>
        </div>
        <div class="reading-transcript">
            <strong>Full transcript:</strong> "${reading.transcript}"
        </div>
    `;

    return div;
}

// Generate HTML for word diff visualization
function generateWordDiffHtml(wordDiff) {
    if (!wordDiff || wordDiff.length === 0) {
        return '<span class="word-diff-word word-match">No data</span>';
    }

    return wordDiff.map(item => {
        switch (item.type) {
            case 'match':
                return `<span class="word-diff-word word-match" title="Correct">${escapeHtml(item.reference)}</span>`;
            case 'substitute':
                return `<span class="word-diff-word word-substitute" title="Expected: ${escapeHtml(item.reference)}, Heard: ${escapeHtml(item.transcript)}">${escapeHtml(item.reference)} → ${escapeHtml(item.transcript)}</span>`;
            case 'delete':
                return `<span class="word-diff-word word-missing" title="Missing word">${escapeHtml(item.reference)} ✗</span>`;
            case 'insert':
                return `<span class="word-diff-word word-extra" title="Extra word heard">+ ${escapeHtml(item.transcript)}</span>`;
            default:
                return '';
        }
    }).join(' ');
}

// Update comparison table
function updateComparisonTable() {
    if (state.allTests.length === 0) {
        elements.comparisonCard.style.display = 'none';
        return;
    }

    elements.comparisonTableBody.innerHTML = '';

    state.allTests.forEach(test => {
        const row = document.createElement('tr');
        const avgScore = test.averageScore;
        const scoreClass = getScoreClass(avgScore);
        const statusText = getStatusText(avgScore);

        row.innerHTML = `
            <td><strong>${escapeHtml(test.headset)}</strong></td>
            <td>${escapeHtml(getEnvironmentLabel(test.environment))}</td>
            <td><strong class="${scoreClass}">${formatScore(avgScore)}</strong></td>
            <td><span class="status-badge status-${scoreClass}">${statusText}</span></td>
        `;

        elements.comparisonTableBody.appendChild(row);
    });

    elements.comparisonCard.style.display = 'block';
}

// Handle new test
function handleNewTest() {
    // Reset current test state
    state.currentHeadset = null;
    state.currentEnvironment = null;
    state.currentReadings = [];

    // Reset UI
    elements.headsetName.value = '';
    elements.environment.value = '';
    elements.progressText.textContent = '0 of 3 readings complete';
    elements.progressFill.style.width = '0%';
    elements.recordingStatus.textContent = '';
    clearError(elements.recordingError);
    clearError(elements.setupError);

    // Hide results card
    elements.resultsCard.style.display = 'none';

    // Update button state
    updateRecordButtonState();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Calculate score using simple word error rate approach
function calculateScore(reference, transcript) {
    const refWords = normalizeText(reference).split(/\s+/).filter(w => w.length > 0);
    const transWords = normalizeText(transcript).split(/\s+/).filter(w => w.length > 0);

    // Calculate Levenshtein distance at word level
    const distance = levenshteinDistance(refWords, transWords);

    // Calculate accuracy
    const accuracy = Math.max(0, 1 - (distance / refWords.length));

    return accuracy;
}

// Normalize text for comparison
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .trim();
}

// Generate word-by-word diff between reference and transcript
function generateWordDiff(reference, transcript) {
    const refWords = normalizeText(reference).split(/\s+/).filter(w => w.length > 0);
    const transWords = normalizeText(transcript).split(/\s+/).filter(w => w.length > 0);

    // Generate alignment using dynamic programming
    const alignment = alignWords(refWords, transWords);

    return alignment;
}

// Align words using edit distance algorithm with backtracking
function alignWords(refWords, transWords) {
    const m = refWords.length;
    const n = transWords.length;

    // Create DP matrix
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    const backtrack = Array(m + 1).fill(null).map(() => Array(n + 1).fill(null));

    // Initialize base cases
    for (let i = 0; i <= m; i++) {
        dp[i][0] = i;
        backtrack[i][0] = 'delete';
    }
    for (let j = 0; j <= n; j++) {
        dp[0][j] = j;
        backtrack[0][j] = 'insert';
    }
    backtrack[0][0] = 'match';

    // Fill DP matrix
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (refWords[i - 1] === transWords[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
                backtrack[i][j] = 'match';
            } else {
                const sub = dp[i - 1][j - 1] + 1;
                const del = dp[i - 1][j] + 1;
                const ins = dp[i][j - 1] + 1;

                if (sub <= del && sub <= ins) {
                    dp[i][j] = sub;
                    backtrack[i][j] = 'substitute';
                } else if (del <= ins) {
                    dp[i][j] = del;
                    backtrack[i][j] = 'delete';
                } else {
                    dp[i][j] = ins;
                    backtrack[i][j] = 'insert';
                }
            }
        }
    }

    // Backtrack to get alignment
    const alignment = [];
    let i = m, j = n;

    while (i > 0 || j > 0) {
        const op = backtrack[i][j];

        if (op === 'match') {
            alignment.unshift({
                type: 'match',
                reference: refWords[i - 1],
                transcript: transWords[j - 1]
            });
            i--;
            j--;
        } else if (op === 'substitute') {
            alignment.unshift({
                type: 'substitute',
                reference: refWords[i - 1],
                transcript: transWords[j - 1]
            });
            i--;
            j--;
        } else if (op === 'delete') {
            alignment.unshift({
                type: 'delete',
                reference: refWords[i - 1],
                transcript: null
            });
            i--;
        } else if (op === 'insert') {
            alignment.unshift({
                type: 'insert',
                reference: null,
                transcript: transWords[j - 1]
            });
            j--;
        }
    }

    return alignment;
}

// Calculate Levenshtein distance between two arrays
function levenshteinDistance(arr1, arr2) {
    const matrix = [];

    for (let i = 0; i <= arr2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= arr1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= arr2.length; i++) {
        for (let j = 1; j <= arr1.length; j++) {
            if (arr2[i - 1] === arr1[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[arr2.length][arr1.length];
}

// Analyze potential issues
function analyzeIssues(reference, transcript, score) {
    if (score >= CONFIG.ANALYSIS_THRESHOLDS.LOW_ACCURACY) {
        return null; // No significant issues
    }

    const refWords = normalizeText(reference).split(/\s+/).filter(w => w.length > 0);
    const transWords = normalizeText(transcript).split(/\s+/).filter(w => w.length > 0);

    const wordCountDiff = transWords.length - refWords.length;
    const diffRatio = Math.abs(wordCountDiff) / refWords.length;

    // Background noise (too many words captured)
    if (wordCountDiff > 0 && diffRatio > CONFIG.ANALYSIS_THRESHOLDS.WORD_DIFF_RATIO) {
        return 'Possible background noise detected';
    }

    // Dropouts/gating (too few words captured)
    if (wordCountDiff < 0 && diffRatio > CONFIG.ANALYSIS_THRESHOLDS.WORD_DIFF_RATIO) {
        return 'Possible audio dropouts or gating';
    }

    // Calculate substitutions
    const refSet = new Set(refWords);
    const transSet = new Set(transWords);
    const matchingWords = [...transSet].filter(w => refSet.has(w)).length;
    const substitutionRatio = 1 - (matchingWords / refWords.length);

    // High substitution rate
    if (substitutionRatio > CONFIG.ANALYSIS_THRESHOLDS.SUBSTITUTION_RATIO) {
        return 'Possible audio clarity issues';
    }

    // General poor quality
    return 'Low recognition accuracy';
}

// Calculate average score from readings
function calculateAverageScore(readings) {
    if (readings.length === 0) return 0;
    const sum = readings.reduce((acc, reading) => acc + reading.score, 0);
    return sum / readings.length;
}

// Format score as percentage
function formatScore(score) {
    return `${Math.round(score * 100)}%`;
}

// Get score class for styling
function getScoreClass(score) {
    if (score >= CONFIG.SCORE_THRESHOLDS.EXCELLENT) return 'excellent';
    if (score >= CONFIG.SCORE_THRESHOLDS.GOOD) return 'good';
    if (score >= CONFIG.SCORE_THRESHOLDS.FAIR) return 'fair';
    return 'poor';
}

// Get status text from score
function getStatusText(score) {
    if (score >= CONFIG.SCORE_THRESHOLDS.EXCELLENT) return 'Excellent';
    if (score >= CONFIG.SCORE_THRESHOLDS.GOOD) return 'Good';
    if (score >= CONFIG.SCORE_THRESHOLDS.FAIR) return 'Fair';
    return 'Poor';
}

// Get environment label
function getEnvironmentLabel(value) {
    const labels = {
        'quiet': 'Quiet Room',
        'office': 'Office',
        'home': 'Home (Background Noise)',
        'cafe': 'Cafe/Public Space',
        'outdoor': 'Outdoor'
    };
    return labels[value] || value;
}

// Show status message
function showStatus(message) {
    elements.recordingStatus.textContent = message;
    elements.recordingStatus.style.display = 'block';
}

// Show error message
function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

// Clear error message
function clearError(element) {
    element.textContent = '';
    element.style.display = 'none';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
