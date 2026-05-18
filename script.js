/* ============================================
   NUTRI COPILOT — APPLICATION LOGIC
   AI Dietitian Assistant Prototype
   ============================================ */

// ============================================
// STATE
// ============================================
const state = {
    currentPatient: null,
    chatHistory: [],
    contextVisible: false,
    sidebarVisible: true,
    planGenerated: false,
    uploadedFiles: [],
    uploadState: 'idle', // 'idle' | 'review' | 'processing' | 'complete'
    selectedPreferences: {
        diet: [],
        allergies: [],
        conditions: [],
        cuisine: [],
        activity: null,
        goals: [],
        notes: ''
    }
};

// ============================================
// DOM ELEMENTS
// ============================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
    sidebar: $('#sidebar'),
    sidebarToggle: $('#sidebarToggle'),
    mainContent: $('#mainContent'),
    welcomeState: $('#welcomeState'),
    uploadReviewState: $('#uploadReviewState'),
    uploadReviewContent: $('#uploadReviewContent'),
    chatState: $('#chatState'),
    chatMessages: $('#chatMessages'),
    promptInput: $('#promptInput'),
    chatInput: $('#chatInput'),
    generateBtn: $('#generateBtn'),
    chatSendBtn: $('#chatSendBtn'),
    uploadBtn: $('#uploadBtn'),
    chatUploadBtn: $('#chatUploadBtn'),
    voiceBtn: $('#voiceBtn'),
    fileInput: $('#fileInput'),
    newPatientBtn: $('#newPatientBtn'),
    patientSearch: $('#patientSearch'),
    patientList: $('#patientList'),
    contextPanel: $('#contextPanel'),
    contextEmpty: $('#contextEmpty'),
    contextReports: $('#contextReports'),
    contextReportsList: $('#contextReportsList'),
    contextData: $('#contextData'),
    contextPanelClose: $('#contextPanelClose'),
    greeting: $('#greeting'),
    dropZone: $('#dropZone'),
    mobileOverlay: $('#mobileOverlay')
};

// ============================================
// INITIALIZATION
// ============================================
function init() {
    setGreeting();
    bindEvents();
    autoResizeTextareas();
}

function setGreeting() {
    const hour = new Date().getHours();
    let greet = 'Good Evening';
    if (hour < 12) greet = 'Good Morning';
    else if (hour < 17) greet = 'Good Afternoon';
    els.greeting.textContent = `${greet}, Dr. Sharma`;
}

// ============================================
// EVENT BINDINGS
// ============================================
function bindEvents() {
    // Sidebar
    els.sidebarToggle.addEventListener('click', toggleSidebar);
    els.mobileOverlay.addEventListener('click', closePanels);

    // New Patient
    els.newPatientBtn.addEventListener('click', startNewPatient);

    // Patient list
    els.patientList.addEventListener('click', handlePatientClick);

    // Search
    els.patientSearch.addEventListener('input', handlePatientSearch);

    // Prompt actions
    els.generateBtn.addEventListener('click', handlePromptSubmit);
    els.chatSendBtn.addEventListener('click', handleChatSubmit);
    els.uploadBtn.addEventListener('click', () => els.fileInput.click());
    els.chatUploadBtn.addEventListener('click', () => els.fileInput.click());
    els.voiceBtn.addEventListener('click', handleVoice);
    els.fileInput.addEventListener('change', handleFileUpload);

    // Keyboard
    els.promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handlePromptSubmit();
        }
    });

    els.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChatSubmit();
        }
    });

    // Drag & Drop
    const dropZone = els.dropZone;
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.querySelector('.prompt-upload-area').classList.add('dragover');
    });
    document.addEventListener('dragleave', (e) => {
        if (!e.relatedTarget || !dropZone.contains(e.relatedTarget)) {
            dropZone.querySelector('.prompt-upload-area')?.classList.remove('dragover');
        }
    });
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.querySelector('.prompt-upload-area')?.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            simulateReportUpload(e.dataTransfer.files[0].name);
        }
    });

    // Context Panel
    els.contextPanelClose.addEventListener('click', () => {
        els.contextPanel.classList.remove('visible');
    });

    // Quick actions
    $$('.quick-action-card').forEach((card, i) => {
        card.addEventListener('click', () => {
            if (i === 0) els.fileInput.click();
            else if (i === 1) simulateReportUpload('quick_report.pdf');
            else if (i === 2) simulateReportUpload('existing_plan.pdf');
        });
    });
}

// ============================================
// AUTO RESIZE TEXTAREAS
// ============================================
function autoResizeTextareas() {
    [els.promptInput, els.chatInput].forEach(textarea => {
        if (!textarea) return;
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
        });
    });
}

// ============================================
// SIDEBAR
// ============================================
function toggleSidebar() {
    els.sidebar.classList.toggle('visible');
    if (window.innerWidth <= 900) {
        els.mobileOverlay.classList.toggle('hidden', !els.sidebar.classList.contains('visible'));
    }
}

function closePanels() {
    els.sidebar.classList.remove('visible');
    els.contextPanel.classList.remove('visible');
    els.mobileOverlay.classList.add('hidden');
}

// ============================================
// PATIENT MANAGEMENT
// ============================================
function startNewPatient() {
    state.currentPatient = null;
    state.chatHistory = [];
    state.planGenerated = false;
    state.uploadedFiles = [];
    state.uploadState = 'idle';
    state.selectedPreferences = {
        diet: [], allergies: [], conditions: [],
        cuisine: [], activity: null, goals: [], notes: ''
    };

    // Reset UI
    els.welcomeState.classList.remove('hidden');
    els.uploadReviewState.classList.add('hidden');
    els.chatState.classList.add('hidden');
    els.chatMessages.innerHTML = '';
    els.contextEmpty.classList.remove('hidden');
    els.contextReports.classList.add('hidden');
    els.contextData.classList.add('hidden');
    els.promptInput.value = '';

    // Update active state
    $$('.patient-item').forEach(el => el.classList.remove('active'));

    if (window.innerWidth <= 900) closePanels();
}

function handlePatientClick(e) {
    const item = e.target.closest('.patient-item');
    if (!item) return;

    $$('.patient-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');

    // Simulate loading existing patient
    simulateReportUpload('patient_report.pdf');

    if (window.innerWidth <= 900) closePanels();
}

function handlePatientSearch(e) {
    const query = e.target.value.toLowerCase();
    $$('.patient-item').forEach(item => {
        const name = item.querySelector('.patient-name').textContent.toLowerCase();
        item.style.display = name.includes(query) ? 'flex' : 'none';
    });
}

// ============================================
// PROMPT HANDLING
// ============================================
function handlePromptSubmit() {
    const text = els.promptInput.value.trim();
    if (!text) {
        simulateReportUpload('blood_report_sharma.pdf');
        return;
    }

    els.promptInput.value = '';
    els.promptInput.style.height = 'auto';
    transitionToChat();
    addMessage('user', text);
    simulateAIResponse(text);
}

function handleChatSubmit() {
    const text = els.chatInput.value.trim();
    if (!text) return;

    els.chatInput.value = '';
    els.chatInput.style.height = 'auto';
    addMessage('user', text);
    simulateAIResponse(text);
}

// ============================================
// FILE UPLOAD
// ============================================
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        simulateReportUpload(file.name);
    }
    e.target.value = '';
}

function simulateReportUpload(filename) {
    // If already in chat (post-processing), add inline as before
    if (state.uploadState === 'complete') {
        addMessage('user', `Uploaded: ${filename}`, true);
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            addAIMessage(createShimmerContent());
            setTimeout(() => {
                removeLastMessage();
                addAIMessage(createExtractionMessage());
                showContextPanel();
                setTimeout(() => {
                    showTypingIndicator();
                    setTimeout(() => {
                        removeTypingIndicator();
                        addAIMessage(createReviewHub());
                        bindReviewHubButtons();
                        scrollChatToBottom();
                    }, 1200);
                }, 800);
            }, 2000);
        }, 1500);
        return;
    }

    // Add file to the pre-processing queue
    state.uploadedFiles.push(filename);
    state.uploadState = 'review';

    // Hide welcome, show review state
    els.welcomeState.classList.add('hidden');
    els.chatState.classList.add('hidden');
    els.uploadReviewState.classList.remove('hidden');

    // Render the review card
    updateReviewCard();

    // Update right panel with file list
    updateRightPanelReports();
}

// ============================================
// UPLOAD REVIEW CARD
// ============================================
function updateReviewCard() {
    const files = state.uploadedFiles;
    if (files.length === 1) {
        els.uploadReviewContent.innerHTML = createSingleUploadCard(files[0]);
    } else {
        els.uploadReviewContent.innerHTML = createMultiUploadCard(files);
    }
    bindReviewCardButtons();
}

function createSingleUploadCard(filename) {
    return `
        <div class="upload-action-card">
            <div class="upload-success-badge">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
            </div>
            <div class="upload-action-title">
                <em class="upload-action-filename">${filename}</em> uploaded
            </div>
            <p class="upload-action-subtitle">Would you like to add more reports before processing?</p>
            <div class="upload-action-buttons">
                <button class="upload-more-btn" id="uploadMoreBtn">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Upload More
                </button>
                <button class="process-reports-btn" id="processReportsBtn">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                    </svg>
                    Process Report
                </button>
            </div>
        </div>
    `;
}

function createMultiUploadCard(files) {
    const chipHTML = files.map((f, i) => `
        <div class="upload-report-chip" style="animation-delay:${i * 0.07}s">
            <div class="upload-report-chip-icon">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
            </div>
            <span class="upload-report-chip-name">${f}</span>
        </div>
    `).join('');

    return `
        <div class="upload-action-card multi">
            <div class="upload-action-title">${files.length} Reports Ready</div>
            <div class="upload-report-chips">${chipHTML}</div>
            <div class="upload-action-buttons">
                <button class="upload-more-btn" id="uploadMoreBtn">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Add More
                </button>
                <button class="process-reports-btn" id="processReportsBtn">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                    </svg>
                    Process ${files.length} Reports
                </button>
            </div>
        </div>
    `;
}

function bindReviewCardButtons() {
    const uploadMoreBtn = document.getElementById('uploadMoreBtn');
    const processBtn = document.getElementById('processReportsBtn');
    if (uploadMoreBtn) {
        uploadMoreBtn.addEventListener('click', () => els.fileInput.click());
    }
    if (processBtn) {
        processBtn.addEventListener('click', processReports);
    }
}

// ============================================
// PROCESS REPORTS — triggers analysis flow
// ============================================
function processReports() {
    const files = [...state.uploadedFiles];
    state.uploadState = 'processing';

    // Transition to chat
    els.uploadReviewState.classList.add('hidden');
    transitionToChat();

    // Show uploaded files as attachment chips (not chat bubbles)
    showReportAttachments(files);

    // Show staged processing card in AI message
    showTypingIndicator();
    setTimeout(() => {
        removeTypingIndicator();
        const msgEl = addAIMessage(createProcessingStagesHTML(files));
        const stagesList = msgEl.querySelector('.processing-stages-list');
        if (stagesList) {
            animateProcessingStages(stagesList, () => {
                // After all stages complete, show review hub
                setTimeout(() => {
                    removeLastMessage();
                    addAIMessage(createReviewHub());
                    showContextPanel();
                    state.uploadState = 'complete';
                    bindReviewHubButtons();
                }, 500);
            });
        }
    }, 600);
}

function showReportAttachments(files) {
    const el = document.createElement('div');
    el.className = 'report-attachments-row';
    const chips = files.map(f => `
        <div class="report-attachment-chip">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
            </svg>
            <span>${f}</span>
        </div>
    `).join('');
    el.innerHTML = `
        <div class="report-attachments-label">Reports</div>
        <div class="report-attachments-chips">${chips}</div>
    `;
    els.chatMessages.appendChild(el);
    scrollChatToBottom();
}

function createProcessingStagesHTML(files) {
    const count = files.length;
    return `
        <div class="processing-card">
            <div class="processing-card-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
                Analyzing ${count} report${count > 1 ? 's' : ''}...
            </div>
            <div class="processing-stages-list" id="processingStagesList">
                <div class="processing-stage-item" data-stage="1">
                    <div class="processing-stage-dot"></div>
                    <span class="processing-stage-text">Detecting report types</span>
                </div>
                <div class="processing-stage-item" data-stage="2">
                    <div class="processing-stage-dot"></div>
                    <span class="processing-stage-text">Extracting biomarkers</span>
                </div>
                <div class="processing-stage-item" data-stage="3">
                    <div class="processing-stage-dot"></div>
                    <span class="processing-stage-text">Identifying abnormalities</span>
                </div>
                <div class="processing-stage-item" data-stage="4">
                    <div class="processing-stage-dot"></div>
                    <span class="processing-stage-text">Preparing patient context</span>
                </div>
                <div class="processing-stage-item" data-stage="5">
                    <div class="processing-stage-dot"></div>
                    <span class="processing-stage-text">Generating clinical insights</span>
                </div>
            </div>
        </div>
    `;
}

function animateProcessingStages(stagesListEl, callback) {
    const items = stagesListEl.querySelectorAll('.processing-stage-item');
    let current = 0;

    function next() {
        if (current >= items.length) {
            setTimeout(() => { if (callback) callback(); }, 300);
            return;
        }

        items[current].classList.add('active');
        items[current].querySelector('.processing-stage-dot').innerHTML = `
            <div style="width:6px;height:6px;border-radius:50%;background:white;"></div>
        `;
        scrollChatToBottom();

        setTimeout(() => {
            items[current].classList.remove('active');
            items[current].classList.add('complete');
            items[current].querySelector('.processing-stage-dot').innerHTML = `
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
            `;
            current++;
            setTimeout(next, 180);
        }, 850);
    }

    setTimeout(next, 200);
}

// ============================================
// RIGHT PANEL — REPORTS LIST
// ============================================
function updateRightPanelReports() {
    els.contextEmpty.classList.add('hidden');
    els.contextReports.classList.remove('hidden');

    const docIconSVG = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
        </svg>`;

    els.contextReportsList.innerHTML = state.uploadedFiles.map((f, i) => `
        <div class="context-report-item" style="animation-delay:${i * 0.07}s">
            <div class="context-report-item-icon">${docIconSVG}</div>
            <span class="context-report-item-name">${f}</span>
        </div>
    `).join('');
}

// ============================================
// CHAT MANAGEMENT
// ============================================
function transitionToChat() {
    els.welcomeState.classList.add('hidden');
    els.chatState.classList.remove('hidden');
}

function addMessage(type, content, isFile = false) {
    const msg = document.createElement('div');
    msg.className = 'message';

    const avatarClass = type === 'user' ? 'user' : 'ai';
    const avatarText = type === 'user' ? 'DS' : 'AI';
    const label = type === 'user' ? 'You' : 'NutriCopilot';

    msg.innerHTML = `
        <div class="message-avatar ${avatarClass}">${avatarText}</div>
        <div class="message-content">
            <div class="message-label">${label}</div>
            ${isFile ? `
                <div class="upload-success">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                    </svg>
                    <span>${content}</span>
                </div>
            ` : `<p>${content}</p>`}
        </div>
    `;

    els.chatMessages.appendChild(msg);
    scrollChatToBottom();
}

function addAIMessage(htmlContent) {
    const msg = document.createElement('div');
    msg.className = 'message';
    msg.innerHTML = `
        <div class="message-avatar ai">AI</div>
        <div class="message-content">
            <div class="message-label">NutriCopilot</div>
            ${htmlContent}
        </div>
    `;
    els.chatMessages.appendChild(msg);
    scrollChatToBottom();
    return msg;
}

function removeLastMessage() {
    const messages = els.chatMessages.querySelectorAll('.message');
    if (messages.length > 0) {
        messages[messages.length - 1].remove();
    }
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message typing-message';
    indicator.innerHTML = `
        <div class="message-avatar ai">AI</div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    els.chatMessages.appendChild(indicator);
    scrollChatToBottom();
}

function removeTypingIndicator() {
    const typing = els.chatMessages.querySelector('.typing-message');
    if (typing) typing.remove();
}

function scrollChatToBottom() {
    requestAnimationFrame(() => {
        els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
    });
}

// ============================================
// AI RESPONSE SIMULATION
// ============================================
function simulateAIResponse(userText) {
    showTypingIndicator();

    const responses = [
        "I've noted that. Let me adjust the dietary recommendations based on this information.",
        "Thank you for the clarification. I'll incorporate this into the personalized plan.",
        "Understood. This helps me refine the nutritional targets for optimal outcomes.",
        "Got it. I'll factor this into the meal structure and caloric distribution."
    ];

    setTimeout(() => {
        removeTypingIndicator();
        const response = responses[Math.floor(Math.random() * responses.length)];
        streamText(response);
    }, 1500);
}

function streamText(text) {
    const msg = document.createElement('div');
    msg.className = 'message';
    msg.innerHTML = `
        <div class="message-avatar ai">AI</div>
        <div class="message-content">
            <div class="message-label">NutriCopilot</div>
            <p class="streaming-text"></p>
        </div>
    `;
    els.chatMessages.appendChild(msg);

    const textEl = msg.querySelector('.streaming-text');
    let i = 0;
    const interval = setInterval(() => {
        if (i < text.length) {
            textEl.textContent += text[i];
            i++;
            scrollChatToBottom();
        } else {
            clearInterval(interval);
        }
    }, 20);
}

// ============================================
// SHIMMER / LOADING CONTENT
// ============================================
function createShimmerContent() {
    return `
        <p style="margin-bottom: 12px; color: var(--text-secondary); font-size: 13px;">
            Analyzing patient report...
        </p>
        <div class="shimmer long"></div>
        <div class="shimmer medium"></div>
        <div class="shimmer short"></div>
        <div class="shimmer medium"></div>
    `;
}

// ============================================
// EXTRACTION MESSAGE
// ============================================
function createExtractionMessage() {
    return `
        <p style="margin-bottom: 16px;">I've analyzed the patient report. Here's what I extracted:</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
            <div style="padding: 10px; background: var(--bg-tertiary); border-radius: 8px;">
                <span style="font-size: 11px; color: var(--text-tertiary); display: block;">Patient</span>
                <span style="font-size: 13px; font-weight: 500;">Rajesh Sharma, 52M</span>
            </div>
            <div style="padding: 10px; background: var(--bg-tertiary); border-radius: 8px;">
                <span style="font-size: 11px; color: var(--text-tertiary); display: block;">BMI</span>
                <span style="font-size: 13px; font-weight: 500; color: var(--warning);">28.4 (Overweight)</span>
            </div>
            <div style="padding: 10px; background: var(--bg-tertiary); border-radius: 8px;">
                <span style="font-size: 11px; color: var(--text-tertiary); display: block;">HbA1c</span>
                <span style="font-size: 13px; font-weight: 500; color: var(--error);">8.2% (High)</span>
            </div>
            <div style="padding: 10px; background: var(--bg-tertiary); border-radius: 8px;">
                <span style="font-size: 11px; color: var(--text-tertiary); display: block;">BP</span>
                <span style="font-size: 13px; font-weight: 500; color: var(--warning);">142/92 mmHg</span>
            </div>
            <div style="padding: 10px; background: var(--bg-tertiary); border-radius: 8px;">
                <span style="font-size: 11px; color: var(--text-tertiary); display: block;">Cholesterol</span>
                <span style="font-size: 13px; font-weight: 500; color: var(--error);">245 mg/dL</span>
            </div>
            <div style="padding: 10px; background: var(--bg-tertiary); border-radius: 8px;">
                <span style="font-size: 11px; color: var(--text-tertiary); display: block;">Vitamin D</span>
                <span style="font-size: 13px; font-weight: 500; color: var(--info);">12 ng/mL (Low)</span>
            </div>
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); padding: 10px; background: var(--warning-light); border-radius: 8px; border-left: 3px solid var(--warning);">
            ⚠️ Patient shows signs of uncontrolled Type 2 Diabetes with hypertension. Dietary intervention is critical.
        </p>
    `;
}

// ============================================
// CONTEXT COLLECTION UI
// ============================================
function createContextCollectionUI() {
    return `
        <p style="margin-bottom: 16px;">Please confirm patient preferences before I generate the diet plan:</p>
        <div class="context-cards-container">
            <!-- Diet Preference -->
            <div class="context-card">
                <div class="context-card-title">🥗 Diet Preference</div>
                <div class="chips-container" data-category="diet">
                    <span class="chip" data-value="Vegetarian">Vegetarian</span>
                    <span class="chip" data-value="Non Vegetarian">Non Vegetarian</span>
                    <span class="chip" data-value="Vegan">Vegan</span>
                    <span class="chip" data-value="Jain">Jain</span>
                    <span class="chip" data-value="Eggetarian">Eggetarian</span>
                    <span class="chip" data-value="Other">Other</span>
                </div>
            </div>

            <!-- Allergies -->
            <div class="context-card">
                <div class="context-card-title">⚠️ Allergies</div>
                <div class="chips-container" data-category="allergies" data-multi="true">
                    <span class="chip" data-value="Lactose">Lactose</span>
                    <span class="chip" data-value="Gluten">Gluten</span>
                    <span class="chip" data-value="Nuts">Nuts</span>
                    <span class="chip" data-value="Soy">Soy</span>
                    <span class="chip" data-value="Seafood">Seafood</span>
                    <span class="chip" data-value="None">None</span>
                </div>
            </div>

            <!-- Medical Conditions -->
            <div class="context-card">
                <div class="context-card-title">🏥 Medical Conditions</div>
                <div class="chips-container" data-category="conditions" data-multi="true">
                    <span class="chip selected" data-value="Diabetes">Diabetes</span>
                    <span class="chip selected" data-value="Hypertension">Hypertension</span>
                    <span class="chip" data-value="Thyroid">Thyroid</span>
                    <span class="chip" data-value="PCOS">PCOS</span>
                    <span class="chip" data-value="Kidney Disease">Kidney Disease</span>
                    <span class="chip" data-value="Fatty Liver">Fatty Liver</span>
                    <span class="chip" data-value="Other">Other</span>
                </div>
            </div>

            <!-- Cuisine Preference -->
            <div class="context-card">
                <div class="context-card-title">🍛 Cuisine Preference</div>
                <div class="chips-container" data-category="cuisine" data-multi="true">
                    <span class="chip" data-value="Indian">Indian</span>
                    <span class="chip" data-value="South Indian">South Indian</span>
                    <span class="chip" data-value="Gujarati">Gujarati</span>
                    <span class="chip" data-value="Punjabi">Punjabi</span>
                    <span class="chip" data-value="Maharashtrian">Maharashtrian</span>
                    <span class="chip" data-value="High Protein">High Protein</span>
                    <span class="chip" data-value="Satvik">Satvik</span>
                    <span class="chip" data-value="Other">Other</span>
                </div>
            </div>

            <!-- Activity Level -->
            <div class="context-card">
                <div class="context-card-title">🏃 Activity Level</div>
                <div class="activity-chips" data-category="activity">
                    <span class="activity-chip" data-value="Sedentary">Sedentary</span>
                    <span class="activity-chip" data-value="Moderate">Moderate</span>
                    <span class="activity-chip" data-value="Active">Active</span>
                </div>
            </div>

            <!-- Goals -->
            <div class="context-card">
                <div class="context-card-title">🎯 Goals</div>
                <div class="chips-container" data-category="goals" data-multi="true">
                    <span class="chip selected" data-value="Sugar Control">Sugar Control</span>
                    <span class="chip" data-value="Weight Loss">Weight Loss</span>
                    <span class="chip" data-value="Muscle Gain">Muscle Gain</span>
                    <span class="chip selected" data-value="Heart Healthy">Heart Healthy</span>
                    <span class="chip" data-value="Kidney Safe">Kidney Safe</span>
                </div>
            </div>

            <!-- Additional Notes -->
            <div class="context-card">
                <div class="context-card-title">📝 Additional Notes</div>
                <textarea class="context-textarea" placeholder="Any specific dietary preferences, timing constraints, cultural considerations..." id="additionalNotes"></textarea>
            </div>

            <button class="generate-plan-btn" id="generatePlanBtn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                </svg>
                Generate Diet Plan
            </button>
        </div>
    `;
}

// ============================================
// CONTEXT PANEL
// ============================================
function showContextPanel() {
    els.contextEmpty.classList.add('hidden');
    els.contextReports.classList.add('hidden');
    els.contextData.classList.remove('hidden');
    addBiomarkerCTAToPanel();
    // On large screens the panel is always visible in the layout.
    // On narrow screens, keep it closed so it doesn't cover the review hub;
    // the doctor can open it manually via the toggle button.
}

// ============================================
// DIET PLAN GENERATION
// ============================================
function generateDietPlan() {
    collectPreferences();
    state.planGenerated = false;
    state.planApproved = false;
    removeGeneratedPlanCard();

    const trigger = document.getElementById('proceedGenerateBtn') || document.getElementById('generatePlanBtn');
    if (trigger) {
        trigger.disabled = true;
        trigger.classList.add('is-generating');
        trigger.dataset.originalLabel = trigger.innerHTML;
        trigger.innerHTML = `
            <span class="btn-spinner"></span>
            Generating Plan
        `;
    }

    setTimeout(() => {
        state.planGenerated = true;
        renderGeneratedPlanCard();
        if (trigger) {
            trigger.disabled = false;
            trigger.classList.remove('is-generating');
            trigger.innerHTML = trigger.dataset.originalLabel || 'Generate Diet Plan';
        }
    }, 1900);
}

function collectPreferences() {
    const containers = els.chatMessages.querySelectorAll('.chips-container');
    containers.forEach(container => {
        const category = container.dataset.category;
        const selected = container.querySelectorAll('.chip.selected');
        state.selectedPreferences[category] = Array.from(selected).map(c => c.dataset.value);
    });

    const activityChips = els.chatMessages.querySelectorAll('.activity-chip.selected');
    if (activityChips.length > 0) {
        state.selectedPreferences.activity = activityChips[0].dataset.value;
    }

    const notes = els.chatMessages.querySelector('#additionalNotes');
    if (notes) {
        state.selectedPreferences.notes = notes.value;
    }
}

function createWorkflowSteps() {
    return `
        <p style="margin-bottom: 12px;">Generating your personalized diet plan...</p>
        <div class="workflow-steps">
            <div class="workflow-step" data-step="1">
                <div class="workflow-step-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="4"/>
                    </svg>
                </div>
                <span class="workflow-step-text">Analyzing clinical reports...</span>
            </div>
            <div class="workflow-step" data-step="2">
                <div class="workflow-step-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="4"/>
                    </svg>
                </div>
                <span class="workflow-step-text">Reviewing clinical restrictions...</span>
            </div>
            <div class="workflow-step" data-step="3">
                <div class="workflow-step-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="4"/>
                    </svg>
                </div>
                <span class="workflow-step-text">Personalizing nutrition targets...</span>
            </div>
            <div class="workflow-step" data-step="4">
                <div class="workflow-step-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="4"/>
                    </svg>
                </div>
                <span class="workflow-step-text">Building meal structure...</span>
            </div>
        </div>
    `;
}

function animateWorkflowSteps(steps, callback) {
    let current = 0;
    const interval = setInterval(() => {
        if (current > 0) {
            steps[current - 1].classList.remove('active');
            steps[current - 1].classList.add('completed');
            steps[current - 1].querySelector('.workflow-step-icon').innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
            `;
        }

        if (current < steps.length) {
            steps[current].classList.add('active');
            current++;
            scrollChatToBottom();
        } else {
            clearInterval(interval);
            if (callback) callback();
        }
    }, 1000);
}

// ============================================
// DIET PLAN HTML
// ============================================
function createDietPlanHTML() {
    return `
        <p style="margin-bottom: 8px;">Here's the personalized diet plan for <strong>Rajesh Sharma</strong>:</p>
        <p style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 16px;">
            Optimized for: Sugar Control • Heart Healthy • Low Sodium • High Fiber
        </p>
        <div class="diet-plan-container">
            <div class="meal-card" style="animation-delay: 0.1s">
                <div class="meal-card-header">
                    <div class="meal-card-title">
                        <div class="meal-time-icon" style="background: #fef3c7;">🌅</div>
                        <div>
                            <h4>Early Morning</h4>
                            <span>6:00 – 6:30 AM</span>
                        </div>
                    </div>
                    <div class="meal-card-actions">
                        <button class="meal-action-btn edit-meal" title="Edit">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="meal-action-btn regen-meal" title="Regenerate">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23,4 23,10 17,10"/>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <ul class="meal-items">
                    <li>Warm water with lemon and methi seeds (soaked overnight)</li>
                    <li>5 almonds (soaked) + 2 walnuts</li>
                </ul>
            </div>

            <div class="meal-card" style="animation-delay: 0.2s">
                <div class="meal-card-header">
                    <div class="meal-card-title">
                        <div class="meal-time-icon" style="background: #fef9c3;">🍳</div>
                        <div>
                            <h4>Breakfast</h4>
                            <span>8:00 – 8:30 AM</span>
                        </div>
                    </div>
                    <div class="meal-card-actions">
                        <button class="meal-action-btn edit-meal" title="Edit">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="meal-action-btn regen-meal" title="Regenerate">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23,4 23,10 17,10"/>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <ul class="meal-items">
                    <li>Moong dal chilla (2 pcs) with mint chutney</li>
                    <li>1 bowl vegetable upma (low oil, with oats)</li>
                    <li>Green tea or black coffee (no sugar)</li>
                </ul>
            </div>

            <div class="meal-card" style="animation-delay: 0.3s">
                <div class="meal-card-header">
                    <div class="meal-card-title">
                        <div class="meal-time-icon" style="background: #e0f2fe;">🍎</div>
                        <div>
                            <h4>Mid-Morning Snack</h4>
                            <span>10:30 – 11:00 AM</span>
                        </div>
                    </div>
                    <div class="meal-card-actions">
                        <button class="meal-action-btn edit-meal" title="Edit">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="meal-action-btn regen-meal" title="Regenerate">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23,4 23,10 17,10"/>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <ul class="meal-items">
                    <li>1 small apple or guava (low GI fruit)</li>
                    <li>Handful of roasted chana (20g)</li>
                </ul>
            </div>

            <div class="meal-card" style="animation-delay: 0.4s">
                <div class="meal-card-header">
                    <div class="meal-card-title">
                        <div class="meal-time-icon" style="background: #dcfce7;">🥗</div>
                        <div>
                            <h4>Lunch</h4>
                            <span>1:00 – 1:30 PM</span>
                        </div>
                    </div>
                    <div class="meal-card-actions">
                        <button class="meal-action-btn edit-meal" title="Edit">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="meal-action-btn regen-meal" title="Regenerate">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23,4 23,10 17,10"/>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <ul class="meal-items">
                    <li>1 small jowar/bajra roti + 1 multigrain roti</li>
                    <li>1 bowl dal (masoor/moong) – low salt</li>
                    <li>Lauki/tinda sabzi (low oil preparation)</li>
                    <li>Cucumber & tomato salad with lemon dressing</li>
                    <li>1 small bowl curd (low fat)</li>
                </ul>
            </div>

            <div class="meal-card" style="animation-delay: 0.5s">
                <div class="meal-card-header">
                    <div class="meal-card-title">
                        <div class="meal-time-icon" style="background: #fce7f3;">☕</div>
                        <div>
                            <h4>Evening Snack</h4>
                            <span>4:30 – 5:00 PM</span>
                        </div>
                    </div>
                    <div class="meal-card-actions">
                        <button class="meal-action-btn edit-meal" title="Edit">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="meal-action-btn regen-meal" title="Regenerate">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23,4 23,10 17,10"/>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <ul class="meal-items">
                    <li>Green tea (unsweetened)</li>
                    <li>1 multigrain khakhra or 2 flax crackers</li>
                    <li>Sprout salad with lemon (small bowl)</li>
                </ul>
            </div>

            <div class="meal-card" style="animation-delay: 0.6s">
                <div class="meal-card-header">
                    <div class="meal-card-title">
                        <div class="meal-time-icon" style="background: #ede9fe;">🌙</div>
                        <div>
                            <h4>Dinner</h4>
                            <span>7:30 – 8:00 PM</span>
                        </div>
                    </div>
                    <div class="meal-card-actions">
                        <button class="meal-action-btn edit-meal" title="Edit">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="meal-action-btn regen-meal" title="Regenerate">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23,4 23,10 17,10"/>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <ul class="meal-items">
                    <li>1 multigrain roti (small)</li>
                    <li>Palak/methi sabzi (low oil, no cream)</li>
                    <li>1 bowl mix veg soup (clear, no corn starch)</li>
                    <li>Small portion grilled paneer (50g) or fish</li>
                </ul>
            </div>

            <div class="meal-card" style="animation-delay: 0.7s">
                <div class="meal-card-header">
                    <div class="meal-card-title">
                        <div class="meal-time-icon" style="background: #e0f2fe;">💧</div>
                        <div>
                            <h4>Hydration Plan</h4>
                            <span>Throughout the day</span>
                        </div>
                    </div>
                </div>
                <ul class="meal-items">
                    <li>Minimum 2.5–3 liters of water daily</li>
                    <li>1 glass warm water before each meal</li>
                    <li>Coconut water (unsweetened) – 1 glass post lunch</li>
                    <li>Avoid sugary drinks, packaged juices, sodas</li>
                </ul>
            </div>

            <div class="meal-card avoid" style="animation-delay: 0.8s">
                <div class="meal-card-header">
                    <div class="meal-card-title">
                        <div class="meal-time-icon" style="background: var(--error-light);">🚫</div>
                        <div>
                            <h4>Foods to Avoid</h4>
                            <span>Strict restrictions</span>
                        </div>
                    </div>
                </div>
                <ul class="meal-items">
                    <li>White rice, maida, white bread, refined flour products</li>
                    <li>Sugar, jaggery, honey in excess</li>
                    <li>Fried foods, pakoras, samosas, chips</li>
                    <li>Full-fat dairy, butter, ghee (limit to 1 tsp/day)</li>
                    <li>Mango, banana, grapes, chikoo (high GI fruits)</li>
                    <li>Pickles, papads, processed foods (high sodium)</li>
                </ul>
            </div>

            <div class="meal-card supplements" style="animation-delay: 0.9s">
                <div class="meal-card-header">
                    <div class="meal-card-title">
                        <div class="meal-time-icon" style="background: var(--info-light);">💊</div>
                        <div>
                            <h4>Supplement Notes</h4>
                            <span>Doctor to prescribe</span>
                        </div>
                    </div>
                </div>
                <ul class="meal-items">
                    <li>Vitamin D3 — 60,000 IU weekly (8 weeks) then maintenance</li>
                    <li>Omega-3 fatty acids — 1000mg daily</li>
                    <li>Chromium picolinate — may improve insulin sensitivity</li>
                    <li>Fiber supplement — Isabgol 1 tsp at bedtime if needed</li>
                </ul>
            </div>
        </div>

        <!-- Plan Actions -->
        <div class="plan-actions">
            <button class="plan-action-btn secondary" id="regeneratePlanBtn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23,4 23,10 17,10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Regenerate
            </button>
            <button class="plan-action-btn success" id="approvePlanBtn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
                Approve Plan
            </button>
            <button class="plan-action-btn primary" id="exportPdfBtn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export PDF
            </button>
        </div>
    `;
}

// ============================================
// PLAN ACTIONS
// ============================================
function bindPlanActions() {
    setTimeout(() => {
        const regenerateBtn = document.getElementById('regeneratePlanBtn');
        const approveBtn = document.getElementById('approvePlanBtn');
        const exportBtn = document.getElementById('exportPdfBtn');

        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                addMessage('user', 'Please regenerate the diet plan with more variety.');
                showTypingIndicator();
                setTimeout(() => {
                    removeTypingIndicator();
                    streamText("I'll regenerate the plan with more variety while keeping the same nutritional targets. Give me a moment...");
                }, 1500);
            });
        }

        if (approveBtn) {
            approveBtn.addEventListener('click', () => {
                const approvedDiv = document.createElement('div');
                approvedDiv.className = 'plan-approved';
                approvedDiv.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                    <span>Diet plan approved by Dr. Sharma • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                `;

                const planActions = document.querySelector('.plan-actions');
                if (planActions) {
                    planActions.parentNode.insertBefore(approvedDiv, planActions.nextSibling);
                    planActions.remove();
                }
                scrollChatToBottom();
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                // Simulate PDF export
                exportBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20,6 9,17 4,12"/>
                    </svg>
                    Downloaded!
                `;
                exportBtn.style.background = 'var(--success)';
                setTimeout(() => {
                    exportBtn.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Export PDF
                    `;
                    exportBtn.style.background = '';
                }, 2000);
            });
        }

        // Edit meal buttons
        document.querySelectorAll('.edit-meal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.meal-card');
                const items = card.querySelector('.meal-items');
                if (items.contentEditable === 'true') {
                    items.contentEditable = 'false';
                    items.style.background = '';
                    items.style.padding = '';
                    items.style.borderRadius = '';
                } else {
                    items.contentEditable = 'true';
                    items.style.background = 'var(--accent-primary-light)';
                    items.style.padding = '8px';
                    items.style.borderRadius = '6px';
                    items.focus();
                }
            });
        });

        // Regenerate meal buttons
        document.querySelectorAll('.regen-meal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.meal-card');
                const items = card.querySelector('.meal-items');
                items.style.opacity = '0.5';
                setTimeout(() => {
                    items.style.opacity = '1';
                }, 1000);
            });
        });
    }, 100);
}

// ============================================
// VOICE (Simulation)
// ============================================
function handleVoice() {
    const btn = els.voiceBtn;
    btn.classList.toggle('recording');

    if (btn.classList.contains('recording')) {
        // Simulate recording
        setTimeout(() => {
            btn.classList.remove('recording');
            els.promptInput.value = "Patient is a 52 year old male with uncontrolled diabetes and high cholesterol. Needs a strict vegetarian diet plan.";
            els.promptInput.dispatchEvent(new Event('input'));
        }, 3000);
    }
}

// ============================================
// EVENT DELEGATION FOR DYNAMIC ELEMENTS
// ============================================
document.addEventListener('click', (e) => {
    // Chip selection
    if (e.target.classList.contains('chip')) {
        const container = e.target.closest('.chips-container');
        const isMulti = container?.dataset.multi === 'true';

        if (isMulti) {
            e.target.classList.toggle('selected');
        } else {
            container.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
            e.target.classList.add('selected');
        }
    }

    // Activity chip selection
    if (e.target.classList.contains('activity-chip')) {
        const container = e.target.closest('.activity-chips');
        container.querySelectorAll('.activity-chip').forEach(c => c.classList.remove('selected'));
        e.target.classList.add('selected');
    }

    // Generate Plan button
    if (e.target.id === 'generatePlanBtn' || e.target.closest('#generatePlanBtn')) {
        generateDietPlan();
    }
});

// ============================================
// BIOMARKER DATA
// ============================================
const BIOMARKER_DATA = {
    metabolic: {
        label: 'Metabolic Health',
        markers: [
            { name: 'HbA1c', value: '8.2', unit: '%', normalRange: '4.0 – 5.6', status: 'high', position: 85, source: 'HbA1c_Report.pdf', page: 2, interpretation: 'Poor glucose control detected. Indicates uncontrolled Type 2 Diabetes.' },
            { name: 'Fasting Blood Sugar', value: '168', unit: 'mg/dL', normalRange: '70 – 100', status: 'high', position: 80, source: 'CBC_Report.pdf', page: 3, interpretation: 'Significantly elevated. Immediate dietary intervention required.' },
            { name: 'Post Prandial Sugar', value: '224', unit: 'mg/dL', normalRange: '< 140', status: 'high', position: 90, source: 'CBC_Report.pdf', page: 3 },
            { name: 'Insulin', value: '18.4', unit: 'µIU/mL', normalRange: '2.6 – 24.9', status: 'normal', position: 55, source: 'CBC_Report.pdf', page: 4 }
        ]
    },
    cardiovascular: {
        label: 'Cardiovascular',
        markers: [
            { name: 'Total Cholesterol', value: '245', unit: 'mg/dL', normalRange: '< 200', status: 'high', position: 78, source: 'Lipid_Profile.pdf', page: 1 },
            { name: 'LDL Cholesterol', value: '162', unit: 'mg/dL', normalRange: '< 100', status: 'high', position: 82, source: 'Lipid_Profile.pdf', page: 1, interpretation: 'High LDL increases cardiovascular risk. Reduce saturated fat intake.' },
            { name: 'HDL Cholesterol', value: '38', unit: 'mg/dL', normalRange: '> 40', status: 'low', position: 22, source: 'Lipid_Profile.pdf', page: 1 },
            { name: 'Triglycerides', value: '210', unit: 'mg/dL', normalRange: '< 150', status: 'high', position: 76, source: 'Lipid_Profile.pdf', page: 2 },
            { name: 'Blood Pressure', value: '142/92', unit: 'mmHg', normalRange: '< 120/80', status: 'borderline', position: 68, source: 'CBC_Report.pdf', page: 1 }
        ]
    },
    nutritional: {
        label: 'Nutritional',
        markers: [
            { name: 'Vitamin D', value: '12', unit: 'ng/mL', normalRange: '30 – 100', status: 'low', position: 12, source: 'CBC_Report.pdf', page: 5, interpretation: 'Severe deficiency. Supplementation + sun exposure strongly recommended.' },
            { name: 'Vitamin B12', value: '285', unit: 'pg/mL', normalRange: '200 – 900', status: 'normal', position: 40, source: 'CBC_Report.pdf', page: 5 },
            { name: 'Iron (Serum)', value: '68', unit: 'µg/dL', normalRange: '60 – 170', status: 'normal', position: 47, source: 'CBC_Report.pdf', page: 5 }
        ]
    },
    kidney: {
        label: 'Kidney Function',
        markers: [
            { name: 'Creatinine', value: '1.1', unit: 'mg/dL', normalRange: '0.6 – 1.2', status: 'normal', position: 65, source: 'CBC_Report.pdf', page: 6 },
            { name: 'BUN', value: '18', unit: 'mg/dL', normalRange: '7 – 25', status: 'normal', position: 50, source: 'CBC_Report.pdf', page: 6 }
        ]
    },
    liver: {
        label: 'Liver Function',
        markers: [
            { name: 'SGPT (ALT)', value: '42', unit: 'U/L', normalRange: '7 – 40', status: 'borderline', position: 63, source: 'CBC_Report.pdf', page: 7 },
            { name: 'SGOT (AST)', value: '35', unit: 'U/L', normalRange: '10 – 40', status: 'normal', position: 54, source: 'CBC_Report.pdf', page: 7 }
        ]
    }
};

// ============================================
// REVIEW HUB (post-processing landing)
// ============================================
function getPatientContextSummary() {
    return {
        diet: ['Vegetarian'],
        conditions: ['Diabetes', 'Hypertension'],
        cuisine: ['Maharashtrian'],
        goals: ['Sugar Control', 'Heart Healthy', 'Weight Loss'],
        allergies: ['No Seafood'],
        activity: 'Moderate',
        notes: 'No shellfish. Prefers simple home-cooked meals. Office-goer, limited lunch break.'
    };
}

function createContextSummaryChips(limit = 7) {
    const context = getPatientContextSummary();
    return [
        ...context.diet,
        ...context.conditions,
        ...context.cuisine,
        ...context.goals,
        ...context.allergies
    ].slice(0, limit).map(chip => `<span class="rh-ctx-chip">${chip}</span>`).join('');
}

function createGeneratedDietPlanCard() {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `
        <div class="review-hub-card rh-diet-plan rh-diet-plan-success rh-plan-appear" id="generatedPlanCard">
            <div class="rh-success-head">
                <div class="rh-success-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20,6 9,17 4,12"/>
                    </svg>
                </div>
                <div class="rh-card-body">
                    <div class="rh-plan-ready-title">Diet Plan Ready</div>
                    <div class="rh-plan-ready-sub">AI generated personalized nutrition plan</div>
                    <div class="rh-plan-preview-list">
                        <span class="rh-preview-item">Morning meals</span>
                        <span class="rh-preview-item">Lunch recommendations</span>
                        <span class="rh-preview-item">Evening snacks</span>
                        <span class="rh-preview-item">Dinner plan</span>
                        <span class="rh-preview-item">Bedtime nutrition</span>
                    </div>
                    <div class="rh-ctx-chips-compact rh-plan-chips">
                        <span class="rh-ctx-chip rh-ctx-goal">Low GI</span>
                        <span class="rh-ctx-chip rh-ctx-pref">High Fiber</span>
                        <span class="rh-ctx-chip rh-ctx-condition">Low Sodium</span>
                        <span class="rh-ctx-chip rh-ctx-condition">Diabetes Friendly</span>
                    </div>
                    <div class="rh-plan-generated-time">Generated at ${now}</div>
                </div>
            </div>
            <button class="rh-review-plan-btn" id="openGeneratedPlanBtn">
                Review Plan
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </button>
        </div>
    `;
}

function createReviewHub() {
    const totalMarkers = Object.values(BIOMARKER_DATA).reduce((s, g) => s + g.markers.length, 0);
    const abnormalMarkers = Object.values(BIOMARKER_DATA).reduce((s, g) => {
        return s + g.markers.filter(m => m.status !== 'normal').length;
    }, 0);

    return `
        <div class="review-hub">
            <p class="review-hub-intro">Reports processed successfully. Review the extracted findings before generating the diet plan.</p>
            <div class="review-hub-cards">
                <div class="review-hub-card rh-biomarkers">
                    <div class="rh-card-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5m4 0h4m6-11v11m0 0h-4m4 0H9"/>
                        </svg>
                    </div>
                    <div class="rh-card-body">
                        <div class="rh-card-title">Extracted Biomarkers</div>
                        <div class="rh-card-meta">
                            <span>${totalMarkers} detected</span>
                            <span class="rh-badge rh-badge-abnormal">${abnormalMarkers} abnormal</span>
                        </div>
                    </div>
                    <button class="rh-review-btn" id="openBiomarkersBtn">Review →</button>
                </div>
                <div class="review-hub-card rh-context">
                    <div class="rh-card-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                    <div class="rh-card-body">
                        <div class="rh-card-title">Patient Context</div>
                        <div class="rh-ctx-chips-compact">
                            ${createContextSummaryChips()}
                        </div>
                    </div>
                    <button class="rh-review-btn" id="openContextReviewBtn">Edit →</button>
                </div>
                ${state.planGenerated ? createGeneratedDietPlanCard() : ''}
            </div>
            <div class="ctx-review-section hidden" id="ctxReviewSection"></div>
            ${!state.planGenerated ? `
            <div class="rh-generate-row">
                <p class="rh-generate-hint">Context reviewed · Ready to generate.</p>
                <button class="rh-generate-btn" id="proceedGenerateBtn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                    </svg>
                    Generate Diet Plan
                </button>
            </div>` : ''}
        </div>
    `;
}

function bindReviewHubButtons() {
    setTimeout(() => {
        const openBmBtn = document.getElementById('openBiomarkersBtn');
        const openCtxBtn = document.getElementById('openContextReviewBtn');
        const proceedBtn = document.getElementById('proceedGenerateBtn');
        const openPlanBtn = document.getElementById('openGeneratedPlanBtn');
        if (openBmBtn) openBmBtn.onclick = openBiomarkerDrawer;
        if (openCtxBtn) openCtxBtn.onclick = toggleContextReview;
        if (proceedBtn) proceedBtn.onclick = proceedToGenerate;
        if (openPlanBtn) openPlanBtn.onclick = () => openDietPlanDrawer(false);
    }, 100);
}

function proceedToGenerate() {
    generateDietPlan();
}

function removeGeneratedPlanCard() {
    document.getElementById('generatedPlanCard')?.remove();
}

function renderGeneratedPlanCard() {
    removeGeneratedPlanCard();
    const cards = document.querySelector('.review-hub-cards');

    if (cards) {
        cards.insertAdjacentHTML('beforeend', createGeneratedDietPlanCard());

        // Smoothly dismiss the generate row — it served its purpose
        const generateRow = document.querySelector('.rh-generate-row');
        if (generateRow) {
            generateRow.classList.add('rh-generate-row-fade-out');
            setTimeout(() => { generateRow.style.display = 'none'; }, 260);
        }
    } else {
        addAIMessage(`
            <div class="review-hub">
                <div class="review-hub-cards">
                    ${createGeneratedDietPlanCard()}
                </div>
            </div>
        `);
    }

    bindReviewHubButtons();
    document.getElementById('generatedPlanCard')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// BIOMARKER DRAWER
// ============================================
function openBiomarkerDrawer() {
    const overlay = document.getElementById('bmDrawerOverlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            overlay.classList.add('bm-overlay-open');
            overlay.querySelector('.bm-drawer').classList.add('bm-drawer-open');
        });
    });
    // Reset to metabolic tab
    document.querySelectorAll('.bm-group-tab').forEach(t => t.classList.remove('active'));
    const firstTab = document.querySelector('.bm-group-tab[data-group="metabolic"]');
    if (firstTab) firstTab.classList.add('active');
    renderBiomarkerGroup('metabolic');
    bindBiomarkerDrawerEvents();
}

function closeBiomarkerDrawer() {
    const overlay = document.getElementById('bmDrawerOverlay');
    if (!overlay) return;
    overlay.classList.remove('bm-overlay-open');
    overlay.querySelector('.bm-drawer').classList.remove('bm-drawer-open');
    setTimeout(() => overlay.classList.add('hidden'), 320);
}

function bindBiomarkerDrawerEvents() {
    const closeBtn = document.getElementById('bmDrawerClose');
    const overlay = document.getElementById('bmDrawerOverlay');
    if (closeBtn) closeBtn.onclick = closeBiomarkerDrawer;
    overlay.onclick = (e) => { if (e.target === overlay) closeBiomarkerDrawer(); };
    document.querySelectorAll('.bm-group-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.bm-group-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderBiomarkerGroup(tab.dataset.group);
        };
    });
}

function renderBiomarkerGroup(groupKey) {
    const body = document.getElementById('bmDrawerBody');
    const group = BIOMARKER_DATA[groupKey];
    if (!body || !group) return;
    body.innerHTML = group.markers.map(m => createBiomarkerRow(m)).join('');
}

function createBiomarkerRow(marker) {
    const statusLabels = {
        high: 'High ↑', low: 'Low ↓', borderline: 'Borderline',
        normal: 'Normal', critical: 'Critical ↑↑'
    };
    return `
        <div class="bm-row">
            <div class="bm-row-top">
                <span class="bm-row-name">${marker.name}</span>
                <span class="bm-status-badge bm-s-${marker.status}">${statusLabels[marker.status] || marker.status}</span>
            </div>
            <div class="bm-value-line">
                <span class="bm-value bm-val-${marker.status}">${marker.value}<span class="bm-unit"> ${marker.unit}</span></span>
                <span class="bm-normal-range">Normal: ${marker.normalRange} ${marker.unit}</span>
            </div>
            ${createRangeBar(marker.position, marker.status)}
            <div class="bm-row-source">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                </svg>
                ${marker.source} &bull; Page ${marker.page}
            </div>
            ${marker.interpretation ? `<div class="bm-row-interpretation">${marker.interpretation}</div>` : ''}
        </div>
    `;
}

function createRangeBar(position, status) {
    return `
        <div class="bm-range-wrap">
            <div class="bm-range-bar">
                <div class="bm-range-track">
                    <div class="bm-rzone bm-rzone-low"></div>
                    <div class="bm-rzone bm-rzone-normal"></div>
                    <div class="bm-rzone bm-rzone-high"></div>
                </div>
                <div class="bm-range-dot bm-dot-${status}" style="left:calc(${position}% - 6px)"></div>
            </div>
            <div class="bm-range-labels"><span>Low</span><span>Normal</span><span>High</span></div>
        </div>
    `;
}

// ============================================
// PATIENT CONTEXT REVIEW (expandable inline)
// ============================================
function toggleContextReview() {
    const section = document.getElementById('ctxReviewSection');
    const btn = document.getElementById('openContextReviewBtn');
    if (!section) return;
    if (section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        section.innerHTML = createPatientContextReviewHTML();
        if (btn) btn.textContent = 'Close ×';
        bindContextReviewEvents();
        scrollChatToBottom();
    } else {
        section.classList.add('hidden');
        if (btn) btn.textContent = 'Review →';
    }
}

function createPatientContextReviewHTML() {
    return `
        <div class="ctx-review-panel">
            <div class="ctx-review-hdr">
                <h4>Patient Context Review</h4>
                <span class="ctx-review-sub">AI-detected — edit or approve before proceeding</span>
            </div>
            <div class="ctx-review-fields">
                <div class="ctx-rfield">
                    <div class="ctx-rfield-hdr">
                        <span class="ctx-rlabel">Medical Conditions</span>
                        <span class="ctx-ai-tag">AI Detected</span>
                    </div>
                    <div class="ctx-chips-wrap">
                        <span class="ctx-ctag ctx-ctag-on">Diabetes <button class="ctx-ctag-rm">×</button></span>
                        <span class="ctx-ctag ctx-ctag-on">Hypertension <button class="ctx-ctag-rm">×</button></span>
                        <button class="ctx-chip-add">+ Add</button>
                    </div>
                </div>
                <div class="ctx-rfield">
                    <div class="ctx-rfield-hdr">
                        <span class="ctx-rlabel">Diet Preference</span>
                        <span class="ctx-ai-tag">AI Detected</span>
                    </div>
                    <div class="ctx-chips-wrap">
                        <span class="ctx-ctag ctx-ctag-on">Vegetarian <button class="ctx-ctag-rm">×</button></span>
                        <button class="ctx-chip-add">+ Add</button>
                    </div>
                </div>
                <div class="ctx-rfield">
                    <div class="ctx-rfield-hdr">
                        <span class="ctx-rlabel">Allergies</span>
                        <span class="ctx-ai-tag ctx-ai-none">None Detected</span>
                    </div>
                    <div class="ctx-chips-wrap">
                        <span class="ctx-ctag ctx-ctag-dim">None</span>
                        <button class="ctx-chip-add">+ Add</button>
                    </div>
                </div>
                <div class="ctx-rfield">
                    <div class="ctx-rfield-hdr">
                        <span class="ctx-rlabel">Clinical Goals</span>
                        <span class="ctx-ai-tag">AI Detected</span>
                    </div>
                    <div class="ctx-chips-wrap">
                        <span class="ctx-ctag ctx-ctag-on">Sugar Control <button class="ctx-ctag-rm">×</button></span>
                        <span class="ctx-ctag ctx-ctag-on">Heart Healthy <button class="ctx-ctag-rm">×</button></span>
                        <span class="ctx-ctag ctx-ctag-on">Weight Loss <button class="ctx-ctag-rm">×</button></span>
                        <button class="ctx-chip-add">+ Add</button>
                    </div>
                </div>
                <div class="ctx-rfield">
                    <div class="ctx-rfield-hdr">
                        <span class="ctx-rlabel">Activity Level</span>
                        <span class="ctx-ai-tag ctx-ai-none">Inferred</span>
                    </div>
                    <div class="ctx-act-row">
                        <button class="ctx-act-opt" data-val="Sedentary">Sedentary</button>
                        <button class="ctx-act-opt ctx-act-selected" data-val="Moderate">Moderate</button>
                        <button class="ctx-act-opt" data-val="Active">Active</button>
                    </div>
                </div>
                <div class="ctx-rfield">
                    <div class="ctx-rfield-hdr">
                        <span class="ctx-rlabel">Additional Notes</span>
                    </div>
                    <textarea class="ctx-notes-ta" id="ctxReviewNotes">No shellfish. Prefers simple home-cooked meals. Office-goer, limited lunch break.</textarea>
                </div>
            </div>
            <div class="ctx-review-foot" id="ctxReviewFooter">
                <button class="ctx-approve-btn" id="ctxApproveBtn">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20,6 9,17 4,12"/>
                    </svg>
                    Approve Context
                </button>
            </div>
        </div>
    `;
}

function bindContextReviewEvents() {
    document.querySelectorAll('.ctx-ctag-rm').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); e.target.closest('.ctx-ctag').remove(); });
    });
    document.querySelectorAll('.ctx-act-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ctx-act-opt').forEach(b => b.classList.remove('ctx-act-selected'));
            btn.classList.add('ctx-act-selected');
        });
    });
    const approveBtn = document.getElementById('ctxApproveBtn');
    if (approveBtn) approveBtn.addEventListener('click', approvePatientContext);
}

function approvePatientContext() {
    const footer = document.getElementById('ctxReviewFooter');
    if (footer) {
        footer.innerHTML = `
            <div class="ctx-approved-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
                Patient context approved
            </div>`;
    }
    const btn = document.querySelector('.rh-context .rh-review-btn');
    if (btn) { btn.textContent = '✓ Approved'; btn.classList.add('rh-btn-approved'); }
}

// ============================================
// RIGHT PANEL — BIOMARKER CTA
// ============================================
function addBiomarkerCTAToPanel() {
    if (document.getElementById('panelBiomarkerCTA')) return;
    const vitalsGrid = document.getElementById('vitalsGrid');
    if (!vitalsGrid) return;
    const abnormal = Object.values(BIOMARKER_DATA).reduce((s, g) => {
        return s + g.markers.filter(m => m.status !== 'normal').length;
    }, 0);
    const ctaEl = document.createElement('div');
    ctaEl.id = 'panelBiomarkerCTA';
    ctaEl.className = 'panel-bm-cta';
    ctaEl.innerHTML = `
        <button class="panel-bm-btn" id="panelOpenBmBtn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5m4 0h4m6-11v11m0 0h-4m4 0H9"/>
            </svg>
            View All Biomarkers
            <span class="panel-bm-abnormal">${abnormal} abnormal</span>
        </button>`;
    vitalsGrid.parentNode.insertBefore(ctaEl, vitalsGrid.nextSibling);
    document.getElementById('panelOpenBmBtn').addEventListener('click', openBiomarkerDrawer);
}

// ============================================
// DIET PLAN DATA
// ============================================
const DIET_PLAN_DATA = [
    {
        id: 'early-morning',
        title: 'Early Morning',
        time: '6:00 – 6:30 AM',
        icon: '🌅',
        iconBg: '#fef3c7',
        items: [
            'Warm water with lemon and methi seeds (soaked overnight)',
            '5 almonds (soaked) + 2 walnuts'
        ],
        rationale: ['Hydration', 'Blood Sugar Regulation', 'Anti-inflammatory']
    },
    {
        id: 'breakfast',
        title: 'Breakfast',
        time: '8:00 – 8:30 AM',
        icon: '🍳',
        iconBg: '#fef9c3',
        items: [
            'Moong dal chilla (2 pcs) with mint chutney',
            '1 bowl vegetable upma (low oil, with oats)',
            'Green tea or black coffee (no sugar)'
        ],
        rationale: ['High Protein', 'Low GI', 'Fiber Rich']
    },
    {
        id: 'mid-morning',
        title: 'Mid-Morning Snack',
        time: '10:30 – 11:00 AM',
        icon: '🍎',
        iconBg: '#e0f2fe',
        items: [
            '1 small apple or guava (low GI fruit)',
            'Handful of roasted chana (20g)'
        ],
        rationale: ['Low GI Fruit', 'Protein Snack', 'Sustained Energy']
    },
    {
        id: 'lunch',
        title: 'Lunch',
        time: '1:00 – 1:30 PM',
        icon: '🥗',
        iconBg: '#dcfce7',
        items: [
            '1 small jowar/bajra roti + 1 multigrain roti',
            '1 bowl dal (masoor/moong) – low salt',
            'Lauki/tinda sabzi (low oil preparation)',
            'Cucumber & tomato salad with lemon dressing',
            '1 small bowl curd (low fat)'
        ],
        rationale: ['Reduced Sodium', 'Low GI Grains', 'High Fiber', 'Diabetes Friendly']
    },
    {
        id: 'evening-snack',
        title: 'Evening Snack',
        time: '4:30 – 5:00 PM',
        icon: '☕',
        iconBg: '#fce7f3',
        items: [
            'Green tea (unsweetened)',
            '1 multigrain khakhra or 2 flax crackers',
            'Sprout salad with lemon (small bowl)'
        ],
        rationale: ['Antioxidant', 'Low Carb', 'Metabolism Support']
    },
    {
        id: 'dinner',
        title: 'Dinner',
        time: '7:30 – 8:00 PM',
        icon: '🌙',
        iconBg: '#ede9fe',
        items: [
            '1 multigrain roti (small)',
            'Palak/methi sabzi (low oil, no cream)',
            '1 bowl mix veg soup (clear, no corn starch)',
            'Small portion grilled paneer (50g)'
        ],
        rationale: ['Light Carb', 'Iron Rich', 'Heart Healthy', 'Low Calorie']
    },
    {
        id: 'bedtime',
        title: 'Bedtime',
        time: '9:30 – 10:00 PM',
        icon: '🌛',
        iconBg: '#f5f3ff',
        items: [
            '1 glass warm turmeric milk (low fat, no sugar)',
            'Isabgol 1 tsp in water (if needed for fiber)'
        ],
        rationale: ['Anti-inflammatory', 'Calcium', 'Digestive Health']
    }
];

// ============================================
// PLAN READY NOTIFICATION (in chat)
// ============================================
function createPlanReadyNotification() {
    return `
        <div class="plan-ready-notification">
            <div class="prn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
            </div>
            <div class="prn-text">
                <span class="prn-title">Diet plan generated for Rajesh Sharma</span>
                <span class="prn-sub">7 meal sections · Optimized for Diabetes &amp; Hypertension</span>
            </div>
            <button class="prn-open-btn" id="openDpDrawerBtn">Open Plan →</button>
        </div>
    `;
}

// ============================================
// DIET PLAN DRAWER
// ============================================
// ESC key handler — stored so it can be removed on close
function _dpEscHandler(e) {
    if (e.key === 'Escape') closeDietPlanModal();
}

function openDietPlanDrawer(isGenerating = false) {
    const overlay = document.getElementById('dpDrawerOverlay');
    if (!overlay) return;
    const modal = overlay.querySelector('.dp-drawer');
    if (isGenerating) {
        renderDietPlanLoading(modal);
    } else {
        renderDietPlanDrawer(modal);
    }
    // Lock background scroll
    document.body.style.overflow = 'hidden';
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            overlay.classList.add('dp-overlay-open');
            modal.classList.add('dp-drawer-open');
        });
    });
    // ESC to close
    document.addEventListener('keydown', _dpEscHandler);
    // Focus the modal for accessibility
    setTimeout(() => {
        const focusTarget = modal.querySelector('.dp-close-btn, button, [tabindex]');
        if (focusTarget) focusTarget.focus();
    }, 260);
    if (isGenerating) {
        bindDietPlanLoadingEvents();
    } else {
        bindDietPlanDrawerEvents();
    }
}

function closeDietPlanModal() {
    const overlay = document.getElementById('dpDrawerOverlay');
    if (!overlay) return;
    overlay.classList.remove('dp-overlay-open');
    overlay.querySelector('.dp-drawer').classList.remove('dp-drawer-open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', _dpEscHandler);
    setTimeout(() => overlay.classList.add('hidden'), 280);
}

// Keep backward-compat alias
function closeDietPlanDrawer() { closeDietPlanModal(); }

function renderDietPlanDrawer(drawer) {
    const now = new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    const approveLabel = state.planApproved ? 'Plan Approved' : 'Approve Plan';
    const approveClass = state.planApproved ? ' dp-btn-approved' : '';
    const approveDisabled = state.planApproved ? ' disabled' : '';

    drawer.innerHTML = `
        <div class="dp-drawer-header">
            <div class="dp-header-top">
                <div class="dp-title-block">
                    <div class="dp-badge-row">
                        <span class="dp-ai-badge">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                            AI Generated
                        </span>
                        <span class="dp-edit-badge">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Doctor Editable
                        </span>
                    </div>
                    <h2 class="dp-main-title">AI Generated Diet Plan</h2>
                    <div class="dp-patient-info">
                        <span class="dp-patient-name">Rajesh Sharma</span>
                        <span class="dp-patient-meta">Male · 52 yrs · BMI 28.4</span>
                    </div>
                </div>
                <button class="dp-close-btn" id="dpDrawerClose">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="dp-tags-row">
                <span class="dp-risk-tag dp-risk-critical">High Risk</span>
                <span class="dp-risk-tag dp-risk-diabetes">Diabetic</span>
                <span class="dp-ctx-chip">Vegetarian</span>
                <span class="dp-ctx-chip">Sugar Control</span>
                <span class="dp-ctx-chip">Low Sodium</span>
                <span class="dp-ctx-chip">Hypertension</span>
            </div>
            <div class="dp-header-meta">
                <span class="dp-timestamp">Generated ${now}</span>
            </div>
            <div class="dp-header-actions">
                <button class="dp-action-btn dp-btn-regen" id="dpRegenBtn">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    Regenerate
                </button>
                <button class="dp-action-btn dp-btn-export" id="dpExportBtn">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Export PDF
                </button>
                <button class="dp-action-btn dp-btn-approve${approveClass}" id="dpApproveBtn"${approveDisabled}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                    ${approveLabel}
                </button>
            </div>
        </div>
        <div class="dp-drawer-body" id="dpDrawerBody">
            ${buildAccordionHTML()}
        </div>
    `;
}

function getDietPlanSections() {
    return [
        {
            id: 'morning',
            title: 'Morning',
            time: '7:30 - 8:30 AM',
            icon: 'AM',
            iconBg: '#fef3c7',
            items: [
                'Moong dal chilla (2 pcs) with mint chutney',
                '1 bowl vegetable upma (low oil, with oats)',
                'Green tea or black coffee (no sugar)'
            ],
            rationale: ['High Protein', 'Low GI', 'Diabetes Friendly', 'Fiber Rich']
        },
        {
            id: 'mid-morning',
            title: 'Mid Morning',
            time: '10:30 - 11:00 AM',
            icon: 'MM',
            iconBg: '#e0f2fe',
            items: [
                '1 small apple or guava (low GI fruit)',
                'Handful of roasted chana (20g)'
            ],
            rationale: ['Low GI Fruit', 'Protein Snack', 'Sustained Energy']
        },
        {
            id: 'lunch',
            title: 'Lunch',
            time: '1:00 - 1:30 PM',
            icon: 'LN',
            iconBg: '#dcfce7',
            items: [
                '1 small jowar/bajra roti + 1 multigrain roti',
                '1 bowl dal (masoor/moong) - low salt',
                'Lauki/tinda sabzi (low oil preparation)',
                'Cucumber and tomato salad with lemon dressing',
                '1 small bowl curd (low fat)'
            ],
            rationale: ['Reduced Sodium', 'Low GI Grains', 'High Fiber', 'Diabetes Friendly']
        },
        {
            id: 'evening-snack',
            title: 'Evening Snack',
            time: '4:30 - 5:00 PM',
            icon: 'ES',
            iconBg: '#fce7f3',
            items: [
                'Green tea (unsweetened)',
                '1 multigrain khakhra or 2 flax crackers',
                'Sprout salad with lemon (small bowl)'
            ],
            rationale: ['Antioxidant', 'Low Carb', 'Metabolism Support']
        },
        {
            id: 'dinner',
            title: 'Dinner',
            time: '7:30 - 8:00 PM',
            icon: 'DN',
            iconBg: '#ede9fe',
            items: [
                '1 multigrain roti (small)',
                'Palak/methi sabzi (low oil, no cream)',
                '1 bowl mix veg soup (clear, no corn starch)',
                'Small portion grilled paneer (50g)'
            ],
            rationale: ['Light Carb', 'Iron Rich', 'Heart Healthy', 'Low Calorie']
        },
        {
            id: 'bedtime',
            title: 'Bedtime',
            time: '9:30 - 10:00 PM',
            icon: 'BT',
            iconBg: '#f5f3ff',
            items: [
                '1 glass warm turmeric milk (low fat, no sugar)',
                'Isabgol 1 tsp in water (if needed for fiber)'
            ],
            rationale: ['Anti-inflammatory', 'Calcium', 'Digestive Health']
        }
    ];
}

function renderDietPlanLoading(drawer) {
    drawer.innerHTML = `
        <div class="dp-drawer-header dp-loading-header">
            <div class="dp-header-top">
                <div class="dp-title-block">
                    <div class="dp-badge-row">
                        <span class="dp-ai-badge">AI Generated</span>
                        <span class="dp-edit-badge">Doctor Editable</span>
                    </div>
                    <h2 class="dp-main-title">AI Generated Diet Plan</h2>
                    <div class="dp-patient-info">
                        <span class="dp-patient-name">Rajesh Sharma</span>
                        <span class="dp-patient-meta">Generating clinical review workspace</span>
                    </div>
                </div>
                <button class="dp-close-btn" id="dpDrawerClose">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
        </div>
        <div class="dp-drawer-body dp-loading-body">
            <div class="dp-generation-card">
                <div class="dp-generation-title">Generating personalized diet plan...</div>
                <div class="dp-generation-steps">
                    <div class="dp-gen-step active"><span></span>Diabetes-safe meals</div>
                    <div class="dp-gen-step active"><span></span>Glycemic optimization</div>
                    <div class="dp-gen-step active"><span></span>Regional cuisine adaptation</div>
                    <div class="dp-gen-step active"><span></span>Sodium reduction balancing</div>
                </div>
            </div>
            <div class="dp-skeleton-acc">
                ${Array.from({ length: 6 }).map((_, index) => `
                    <div class="dp-skeleton-row" style="animation-delay:${index * 0.08}s">
                        <div class="dp-skel-icon shimmer"></div>
                        <div class="dp-skel-lines">
                            <div class="dp-skel-line shimmer"></div>
                            <div class="dp-skel-line short shimmer"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function bindDietPlanLoadingEvents() {
    document.getElementById('dpDrawerClose')?.addEventListener('click', closeDietPlanDrawer);
    const overlay = document.getElementById('dpDrawerOverlay');
    if (overlay) {
        overlay.onclick = (e) => { if (e.target === overlay) closeDietPlanDrawer(); };
    }
}

function buildAccordionHTML() {
    return getDietPlanSections().map((meal, index) => buildAccordionItem(meal, index === 0)).join('');
}

function buildAccordionItem(meal, expanded) {
    const checkSVG = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20,6 9,17 4,12"/></svg>`;
    const editSVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    const delSVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>`;
    const regenSVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;
    const addSVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>`;

    const itemsHTML = meal.items.map(item => `
        <li class="dp-meal-li">
            <span class="dp-item-dot"></span>
            <span class="dp-item-text">${item}</span>
            <div class="dp-item-btns">
                <button class="dp-item-btn dp-edit-btn" title="Edit item">${editSVG}</button>
                <button class="dp-item-btn dp-del-btn" title="Remove item">${delSVG}</button>
            </div>
        </li>
    `).join('');

    const rationaleHTML = meal.rationale.map(tag => `
        <span class="dp-rat-tag">${checkSVG} ${tag}</span>
    `).join('');

    return `
        <div class="dp-acc-item ${expanded ? 'dp-acc-expanded' : ''}" data-meal-id="${meal.id}">
            <div class="dp-acc-header">
                <div class="dp-acc-meal-icon" style="background:${meal.iconBg};">${meal.icon}</div>
                <div class="dp-acc-info">
                    <span class="dp-acc-title">${meal.title}</span>
                    <span class="dp-acc-time">${meal.time}</span>
                </div>
                <div class="dp-acc-right">
                    <span class="dp-acc-count">${meal.items.length} item${meal.items.length !== 1 ? 's' : ''}</span>
                    <svg class="dp-acc-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 12,15 18,9"/></svg>
                </div>
            </div>
            <div class="dp-acc-body">
                <ul class="dp-meal-items" id="dp-items-${meal.id}">
                    ${itemsHTML}
                </ul>
                <div class="dp-acc-actions">
                    <button class="dp-add-item-btn" data-meal="${meal.id}">${addSVG} Add Item</button>
                    <button class="dp-regen-section-btn" data-meal="${meal.id}">${regenSVG} Regenerate ${meal.title}</button>
                </div>
                <div class="dp-rationale">
                    <span class="dp-rat-label">Optimized For:</span>
                    ${rationaleHTML}
                </div>
            </div>
        </div>
    `;
}

function bindDietPlanDrawerEvents() {
    setTimeout(() => {
        // Close button & overlay backdrop
        document.getElementById('dpDrawerClose')?.addEventListener('click', closeDietPlanDrawer);
        const overlay = document.getElementById('dpDrawerOverlay');
        if (overlay) {
            overlay.onclick = (e) => { if (e.target === overlay) closeDietPlanDrawer(); };
        }

        // Accordion header toggle
        document.querySelectorAll('.dp-acc-header').forEach(header => {
            header.addEventListener('click', () => {
                const item = header.closest('.dp-acc-item');
                if (item) item.classList.toggle('dp-acc-expanded');
            });
        });

        // Edit buttons — toggle contenteditable inline
        document.querySelectorAll('#dpDrawer .dp-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const textEl = btn.closest('.dp-meal-li')?.querySelector('.dp-item-text');
                if (!textEl) return;
                const isEditing = textEl.contentEditable === 'true';
                textEl.contentEditable = isEditing ? 'false' : 'true';
                textEl.classList.toggle('dp-editing', !isEditing);
                btn.classList.toggle('dp-btn-active', !isEditing);
                if (!isEditing) {
                    textEl.focus();
                    const range = document.createRange();
                    range.selectNodeContents(textEl);
                    range.collapse(false);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            });
        });

        // Delete buttons
        document.querySelectorAll('#dpDrawer .dp-del-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const li = btn.closest('.dp-meal-li');
                if (!li) return;
                li.style.cssText = 'opacity:0;transform:translateX(12px);transition:all 0.2s ease;';
                setTimeout(() => {
                    li.remove();
                    updateAccordionCount(btn.closest('.dp-acc-item'));
                }, 200);
            });
        });

        // Add item buttons
        document.querySelectorAll('.dp-add-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mealId = btn.dataset.meal;
                const list = document.getElementById(`dp-items-${mealId}`);
                if (!list) return;
                const editSVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
                const delSVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>`;
                const li = document.createElement('li');
                li.className = 'dp-meal-li dp-item-new';
                li.innerHTML = `
                    <span class="dp-item-dot"></span>
                    <span class="dp-item-text dp-editing" contenteditable="true">New item</span>
                    <div class="dp-item-btns" style="opacity:1;">
                        <button class="dp-item-btn dp-edit-btn dp-btn-active" title="Edit item">${editSVG}</button>
                        <button class="dp-item-btn dp-del-btn" title="Remove item">${delSVG}</button>
                    </div>
                `;
                list.appendChild(li);
                const textEl = li.querySelector('.dp-item-text');
                textEl.focus();
                document.execCommand('selectAll');

                // Bind new item's buttons
                li.querySelector('.dp-edit-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isEditing = textEl.contentEditable === 'true';
                    textEl.contentEditable = isEditing ? 'false' : 'true';
                    textEl.classList.toggle('dp-editing', !isEditing);
                    li.querySelector('.dp-edit-btn').classList.toggle('dp-btn-active', !isEditing);
                    if (!isEditing) textEl.focus();
                });
                li.querySelector('.dp-del-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    li.style.cssText = 'opacity:0;transform:translateX(12px);transition:all 0.2s ease;';
                    setTimeout(() => {
                        li.remove();
                        updateAccordionCount(btn.closest('.dp-acc-item'));
                    }, 200);
                });
                textEl.addEventListener('blur', () => {
                    if (!textEl.textContent.trim()) {
                        li.remove();
                    } else {
                        textEl.contentEditable = 'false';
                        textEl.classList.remove('dp-editing');
                        li.querySelector('.dp-edit-btn')?.classList.remove('dp-btn-active');
                    }
                    updateAccordionCount(btn.closest('.dp-acc-item'));
                });
                updateAccordionCount(btn.closest('.dp-acc-item'));
            });
        });

        // Regenerate section buttons
        document.querySelectorAll('.dp-regen-section-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mealId = btn.dataset.meal;
                const list = document.getElementById(`dp-items-${mealId}`);
                if (!list) return;
                list.style.opacity = '0.35';
                btn.disabled = true;
                const originalHTML = btn.innerHTML;
                btn.textContent = 'Regenerating...';
                setTimeout(() => {
                    list.style.opacity = '1';
                    btn.disabled = false;
                    btn.innerHTML = originalHTML;
                }, 1500);
            });
        });

        // Approve Plan
        document.getElementById('dpApproveBtn')?.addEventListener('click', approveDietPlan);

        // Export PDF
        document.getElementById('dpExportBtn')?.addEventListener('click', exportDietPlan);

        // Regenerate full plan
        document.getElementById('dpRegenBtn')?.addEventListener('click', () => {
            const drawer = document.getElementById('dpDrawer');
            if (!drawer) return;
            renderDietPlanLoading(drawer);
            bindDietPlanLoadingEvents();
            setTimeout(() => {
                renderDietPlanDrawer(drawer);
                bindDietPlanDrawerEvents();
            }, 1600);
        });
    }, 100);
}

function updateAccordionCount(accItem) {
    if (!accItem) return;
    const n = accItem.querySelectorAll('.dp-meal-li').length;
    const countEl = accItem.querySelector('.dp-acc-count');
    if (countEl) countEl.textContent = `${n} item${n !== 1 ? 's' : ''}`;
}

function approveDietPlan() {
    const btn = document.getElementById('dpApproveBtn');
    if (!btn) return;
    if (state.planApproved) return;
    state.planApproved = true;
    btn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20,6 9,17 4,12"/></svg>
        Plan Approved
    `;
    btn.classList.add('dp-btn-approved');
    btn.disabled = true;

    const approvedDiv = document.createElement('div');
    approvedDiv.className = 'plan-approved';
    approvedDiv.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
        </svg>
        <span>Diet plan approved by Dr. Sharma · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    `;
    els.chatMessages.appendChild(approvedDiv);
    scrollChatToBottom();
}

function exportDietPlan() {
    const btn = document.getElementById('dpExportBtn');
    if (!btn) return;
    const original = btn.innerHTML;
    btn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>
        Downloaded!
    `;
    btn.classList.add('dp-btn-exported');
    setTimeout(() => {
        btn.innerHTML = original;
        btn.classList.remove('dp-btn-exported');
    }, 2500);
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', init);
