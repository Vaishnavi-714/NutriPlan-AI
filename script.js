/* ============================================
   NUTRI COPILOT — APPLICATION LOGIC
   AI Dietitian Assistant Prototype
   ============================================ */

// ============================================
// STATE
// ============================================
const state = {
    currentPatient: null,
    activePatientId: null,
    patientLoadToken: 0,
    isRenderingRecord: false,
    chatHistory: [],
    contextVisible: false,
    sidebarVisible: true,
    planGenerated: false,
    uploadedFiles: [],
    uploadState: 'idle', // 'idle' | 'review' | 'processing' | 'complete'
    contextWizardStep: 0,
    contextWizardData: null,
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

const CONTEXT_WIZARD_STEPS = [
    { id: 'allergies', eyebrow: 'Step 1 of 10', title: 'Does the patient have any allergies?', subtitle: 'Select all relevant allergies or add custom details.' },
    { id: 'diet', eyebrow: 'Step 2 of 10', title: 'What type of diet does the patient follow?', subtitle: 'Choose the primary diet preference.' },
    { id: 'regularFoods', eyebrow: 'Step 3 of 10', title: 'What does the patient usually eat?', subtitle: 'Select common food patterns to help the AI generate realistic plans.' },
    { id: 'likedFoods', eyebrow: 'Step 4 of 10', title: 'What foods does the patient like most?', subtitle: 'Choose preferred foods and cuisines.' },
    { id: 'avoidedFoods', eyebrow: 'Step 5 of 10', title: 'What foods should be avoided?', subtitle: 'Capture dislikes or foods the patient will not eat.' },
    { id: 'routine', eyebrow: 'Step 6 of 10', title: 'What is the patient’s daily routine?', subtitle: 'Help the AI match the meal plan to lifestyle and activity.' },
    { id: 'meals', eyebrow: 'Step 7 of 10', title: 'How many meals does the patient take per day?', subtitle: 'Choose the preferred eating pattern.' },
    { id: 'hydration', eyebrow: 'Step 8 of 10', title: 'How much water does the patient drink daily?', subtitle: 'Hydration helps personalize the plan.' },
    { id: 'goals', eyebrow: 'Step 9 of 10', title: 'What is the main clinical / nutritional focus?', subtitle: 'Choose all applicable goals.' },
    { id: 'review', eyebrow: 'Step 10 of 10', title: 'Review patient context', subtitle: 'Confirm all details before generating the diet plan.' }
];

const WIZARD_OPTIONS = {
    allergies: ['Milk / Dairy', 'Gluten', 'Nuts', 'Soy', 'Shellfish', 'Egg', 'Sesame', 'No known allergies', 'Other'],
    diet: ['Vegetarian', 'Non-vegetarian', 'Vegan', 'Eggetarian', 'Jain', 'Mixed', 'Other'],
    regularFoods: ['Roti / Chapati', 'Rice', 'Dal', 'Paneer', 'Eggs', 'Chicken', 'Fish', 'Fruits', 'Salads', 'Milk / Curd', 'Sprouts', 'Oats', 'Millets', 'Fast food', 'Sweets', 'Tea / Coffee'],
    likedFoods: ['Poha', 'Upma', 'Idli', 'Dosa', 'Paratha', 'Roti', 'Rice', 'Khichdi', 'Paneer dishes', 'Dal', 'Salads', 'Fruit bowls', 'Soup', 'Curd / Buttermilk', 'Nuts / Seeds'],
    cuisines: ['Maharashtrian', 'North Indian', 'South Indian', 'Gujarati', 'Bengali', 'Continental', 'Mixed'],
    avoidedFoods: ['Bitter gourd', 'Curd', 'Broccoli', 'Oats', 'Spicy foods', 'Fried foods'],
    activityLevels: ['Sedentary', 'Lightly active', 'Moderately active', 'Very active'],
    workTypes: ['Desk job', 'Housework', 'Field job', 'Shift duty', 'Student', 'Senior citizen routine'],
    exerciseFrequency: ['None', '1-2 times/week', '3-4 times/week', 'Daily'],
    exerciseTypes: ['Walking', 'Gym', 'Yoga', 'Running', 'Cycling', 'Other'],
    mealsPerDay: ['3 meals', '4 meals', '5 meals', '6 meals'],
    snackPreference: ['Morning snack', 'Evening snack', 'Both', 'None'],
    waterIntake: ['Less than 1 L', '1-1.5 L', '1.5-2 L', '2-3 L', 'More than 3 L'],
    clinicalGoals: ['Diabetes control', 'Weight loss', 'Weight gain', 'Heart healthy', 'Low sodium', 'Low sugar', 'Low fat', 'High protein', 'Renal friendly', 'Thyroid support', 'Digestive health', 'PCOS support', 'General wellness']
};

// Frontend-only clinical record snapshots used to simulate patient-specific workspaces.
const PATIENT_RECORDS = {
    '1': {
        patientId: 'NC-10482', name: 'Rajesh Sharma', initials: 'RS', age: 52, gender: 'Male', bmi: '28.4',
        risk: 'High Risk', riskClass: 'critical', lastActive: '10 min ago', lastUpdated: 'Today, 12:48 PM',
        reports: ['Agent OS.pdf'], workflowState: 'dietPlanReady', planStatus: 'Clinical Diet Plan Ready',
        contextTags: ['Vegetarian', 'Diabetes', 'Hypertension', 'Sugar Control', 'Low Sodium'],
        restrictions: ['No Refined Sugar', 'Low Sodium', 'Low Saturated Fat', 'High Fiber'],
        riskFlags: ['Pre-Diabetic → Diabetic', 'Hypertension Stage 1', 'Vitamin D Deficient', 'High LDL Cholesterol'],
        clinicalNotes: ['Patient shows progressive insulin resistance.', 'Diet must prioritize low glycemic index foods.', 'Lipid profile warrants reduced saturated fat intake.'],
        biomarkers: [
            ['HbA1c', '8.2%', 'high', 'Above Normal'], ['Cholesterol', '245 mg/dL', 'high', 'High'],
            ['BP', '142/92', 'warning', 'Elevated'], ['Vitamin D', '12 ng/mL', 'low', 'Deficient'],
            ['Creatinine', '1.1 mg/dL', 'normal', 'Normal'], ['Fasting Sugar', '168 mg/dL', 'high', 'High']
        ],
        markerValues: { 'HbA1c': ['8.2', 'high', 85], 'Fasting Blood Sugar': ['168', 'high', 80], 'Total Cholesterol': ['245', 'high', 78], 'Blood Pressure': ['142/92', 'borderline', 68], 'Vitamin D': ['12', 'low', 12], 'Creatinine': ['1.1', 'normal', 65] },
        messages: [
            { sender: 'ai', text: 'Report findings are ready for Rajesh Sharma. Diabetes and hypertension risk flags require clinical review.' },
            { sender: 'doctor', text: 'Prioritize low GI meals and sodium control before approval.' }
        ]
    },
    '2': {
        patientId: 'NC-10816', name: 'Priya Mehta', initials: 'PM', age: 44, gender: 'Female', bmi: '26.1',
        risk: 'Moderate Risk', riskClass: 'warning', lastActive: '1 hr ago', lastUpdated: 'Today, 11:30 AM',
        reports: ['Priya_Mehta_Lipid_Report.pdf'], workflowState: 'reportProcessed', planStatus: 'Recommendation Pending',
        contextTags: ['Vegetarian', 'Dyslipidemia', 'Heart Healthy', 'High Fiber'],
        restrictions: ['Low Saturated Fat', 'High Fiber', 'No Fried Foods'],
        riskFlags: ['Elevated LDL Cholesterol', 'Borderline Triglycerides'],
        clinicalNotes: ['Lipid profile indicates dietary fat quality review.', 'Mediterranean-style fats and fiber should be prioritized.'],
        biomarkers: [
            ['HbA1c', '5.7%', 'warning', 'Borderline'], ['Cholesterol', '228 mg/dL', 'high', 'High'],
            ['BP', '126/82', 'warning', 'Borderline'], ['Vitamin D', '28 ng/mL', 'low', 'Insufficient'],
            ['Creatinine', '0.8 mg/dL', 'normal', 'Normal'], ['Fasting Sugar', '103 mg/dL', 'warning', 'Borderline']
        ],
        markerValues: { 'HbA1c': ['5.7', 'borderline', 58], 'Fasting Blood Sugar': ['103', 'borderline', 56], 'Total Cholesterol': ['228', 'high', 72], 'Blood Pressure': ['126/82', 'borderline', 56], 'Vitamin D': ['28', 'low', 28], 'Creatinine': ['0.8', 'normal', 42] },
        messages: [
            { sender: 'ai', text: 'Priya Mehta lipid findings have been processed. Review cardiovascular markers and nutrition context.' },
            { sender: 'doctor', text: 'Review LDL-lowering meal options and dietary fiber targets.' }
        ]
    },
    '3': {
        patientId: 'NC-11007', name: 'Amit Kumar', initials: 'AK', age: 36, gender: 'Male', bmi: '23.7',
        risk: 'Low Risk', riskClass: 'normal', lastActive: '3 hrs ago', lastUpdated: 'Today, 09:42 AM',
        reports: ['Amit_Kumar_CBC_Report.pdf'], workflowState: 'reportUploaded', planStatus: 'Analysis Pending',
        contextTags: ['Non Vegetarian', 'Iron Review', 'Balanced Diet'],
        restrictions: ['Iron Rich Meals', 'Balanced Protein'],
        riskFlags: ['Borderline Iron Level'],
        clinicalNotes: ['CBC report uploaded and waiting for clinical analysis.', 'Assess iron-rich food recommendations after extraction.'],
        biomarkers: [
            ['HbA1c', '5.2%', 'normal', 'Normal'], ['Cholesterol', '178 mg/dL', 'normal', 'Normal'],
            ['BP', '118/76', 'normal', 'Normal'], ['Vitamin D', '31 ng/mL', 'normal', 'Normal'],
            ['Creatinine', '0.9 mg/dL', 'normal', 'Normal'], ['Fasting Sugar', '91 mg/dL', 'normal', 'Normal']
        ],
        markerValues: { 'HbA1c': ['5.2', 'normal', 43], 'Fasting Blood Sugar': ['91', 'normal', 45], 'Total Cholesterol': ['178', 'normal', 47], 'Blood Pressure': ['118/76', 'normal', 48], 'Vitamin D': ['31', 'normal', 37], 'Creatinine': ['0.9', 'normal', 48] },
        messages: [{ sender: 'ai', text: 'Amit Kumar has one uploaded CBC report ready for clinical analysis.' }]
    },
    '4': {
        patientId: 'NC-10339', name: 'Sunita Gupta', initials: 'SG', age: 59, gender: 'Female', bmi: '30.2',
        risk: 'High Risk', riskClass: 'critical', lastActive: '25 May 2026', lastUpdated: '25 May 2026, 05:18 PM',
        reports: ['Sunita_Gupta_Renal_Panel.pdf'], workflowState: 'contextReviewed', planStatus: 'Context Reviewed',
        contextTags: ['Vegetarian', 'Kidney Safe', 'Hypertension', 'Low Sodium'],
        restrictions: ['Low Sodium', 'Renal Friendly', 'Portion Controlled'],
        riskFlags: ['Reduced eGFR', 'Hypertension Stage 2', 'Obesity Risk'],
        clinicalNotes: ['Renal-safe planning input reviewed by clinician.', 'Protein and sodium allocation require close review.'],
        biomarkers: [
            ['HbA1c', '6.4%', 'warning', 'Elevated'], ['Cholesterol', '214 mg/dL', 'high', 'High'],
            ['BP', '154/96', 'high', 'High'], ['Vitamin D', '19 ng/mL', 'low', 'Deficient'],
            ['Creatinine', '1.6 mg/dL', 'high', 'Elevated'], ['Fasting Sugar', '121 mg/dL', 'warning', 'Elevated']
        ],
        markerValues: { 'HbA1c': ['6.4', 'borderline', 66], 'Fasting Blood Sugar': ['121', 'high', 68], 'Total Cholesterol': ['214', 'high', 66], 'Blood Pressure': ['154/96', 'high', 84], 'Vitamin D': ['19', 'low', 19], 'Creatinine': ['1.6', 'high', 82] },
        messages: [
            { sender: 'ai', text: 'Sunita Gupta patient context was reviewed for renal-safe nutrition planning.' },
            { sender: 'doctor', text: 'Keep sodium restriction prominent and review protein portions.' }
        ]
    },
    '5': {
        patientId: 'NC-11142', name: 'Vikram Rao', initials: 'VR', age: 40, gender: 'Male', bmi: '24.9',
        risk: 'Pending Review', riskClass: 'warning', lastActive: '25 May 2026', lastUpdated: '25 May 2026, 02:06 PM',
        reports: [], workflowState: 'noReport', planStatus: 'No Diet Plan Generated',
        contextTags: ['Initial Intake'],
        restrictions: ['Awaiting Report'],
        riskFlags: ['No uploaded report'],
        clinicalNotes: ['Start patient intake to prepare clinical recommendations.'],
        biomarkers: [],
        markerValues: {},
        messages: []
    },
    '6': {
        patientId: 'NC-10195', name: 'Neha Kapoor', initials: 'NK', age: 31, gender: 'Female', bmi: '27.3',
        risk: 'Moderate Risk', riskClass: 'warning', lastActive: '23 May 2026', lastUpdated: '23 May 2026, 03:20 PM',
        reports: ['Neha_Kapoor_PCOS_Profile.pdf'], workflowState: 'dietPlanReady', planStatus: 'Clinical Diet Plan Ready',
        contextTags: ['Vegetarian', 'PCOS', 'Low GI', 'Weight Management'],
        restrictions: ['Low GI', 'High Protein', 'No Sweetened Drinks'],
        riskFlags: ['Insulin Resistance', 'Elevated BMI'],
        clinicalNotes: ['PCOS-focused meal schedule prepared for doctor approval.', 'Maintain protein distribution across meals.'],
        biomarkers: [
            ['HbA1c', '5.9%', 'warning', 'Borderline'], ['Cholesterol', '196 mg/dL', 'warning', 'Borderline'],
            ['BP', '122/80', 'warning', 'Borderline'], ['Vitamin D', '24 ng/mL', 'low', 'Insufficient'],
            ['Creatinine', '0.7 mg/dL', 'normal', 'Normal'], ['Fasting Sugar', '108 mg/dL', 'warning', 'Elevated']
        ],
        markerValues: { 'HbA1c': ['5.9', 'borderline', 61], 'Fasting Blood Sugar': ['108', 'borderline', 59], 'Total Cholesterol': ['196', 'borderline', 58], 'Blood Pressure': ['122/80', 'borderline', 53], 'Vitamin D': ['24', 'low', 24], 'Creatinine': ['0.7', 'normal', 40] },
        messages: [
            { sender: 'ai', text: 'Clinical diet plan is ready for Neha Kapoor with PCOS-sensitive glycemic targets.' },
            { sender: 'doctor', text: 'Maintain high protein breakfast alternatives in the weekly schedule.' }
        ]
    },
    '7': {
        patientId: 'NC-10902', name: 'Deepak Patel', initials: 'DP', age: 63, gender: 'Male', bmi: '25.8',
        risk: 'Moderate Risk', riskClass: 'warning', lastActive: '21 May 2026', lastUpdated: '21 May 2026, 10:12 AM',
        reports: ['Deepak_Patel_Cardiac_Report.pdf'], workflowState: 'reportProcessed', planStatus: 'Doctor Review Required',
        contextTags: ['Jain', 'Cardiac Care', 'Low Sodium', 'Heart Healthy'],
        restrictions: ['Low Sodium', 'Low Saturated Fat', 'Jain Meals'],
        riskFlags: ['Coronary Risk', 'Elevated Blood Pressure'],
        clinicalNotes: ['Cardiac report findings are available for nutrition review.', 'Restrict sodium and saturated fats in recommendation.'],
        biomarkers: [
            ['HbA1c', '5.6%', 'normal', 'Normal'], ['Cholesterol', '236 mg/dL', 'high', 'High'],
            ['BP', '148/90', 'high', 'High'], ['Vitamin D', '33 ng/mL', 'normal', 'Normal'],
            ['Creatinine', '1.2 mg/dL', 'warning', 'Borderline'], ['Fasting Sugar', '98 mg/dL', 'normal', 'Normal']
        ],
        markerValues: { 'HbA1c': ['5.6', 'normal', 52], 'Fasting Blood Sugar': ['98', 'normal', 50], 'Total Cholesterol': ['236', 'high', 76], 'Blood Pressure': ['148/90', 'high', 79], 'Vitamin D': ['33', 'normal', 42], 'Creatinine': ['1.2', 'borderline', 66] },
        messages: [{ sender: 'ai', text: 'Deepak Patel cardiac findings require a heart-healthy clinical nutrition review.' }]
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
    mobileSidebarBtn: $('#mobileSidebarBtn'),
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
    patientSelectBtn: $('#patientSelectBtn'),
    patientDropdownMenu: $('#patientDropdownMenu'),
    topPatientSearch: $('#topPatientSearch'),
    patientSearchResults: $('#patientSearchResults'),
    topPatientAvatar: $('#topPatientAvatar'),
    topPatientLabel: $('#topPatientLabel'),
    addPatientOverlay: $('#addPatientOverlay'),
    addPatientForm: $('#addPatientForm'),
    addPatientClose: $('#addPatientClose'),
    addPatientCancel: $('#addPatientCancel'),
    sidebarHistory: $('#sidebarHistory'),
    historyToggle: $('#historyToggle'),
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
    restoreSidebarState();
    renderPatientSelector();
    selectPatientRecord('1');
    bindEvents();
    autoResizeTextareas();
    initSidebarTooltips();
}

function setGreeting() {
    const hour = new Date().getHours();
    let greet = 'Good Evening';
    if (hour < 12) greet = 'Good Morning';
    else if (hour < 17) greet = 'Good Afternoon';
    els.greeting.textContent = `${greet}, Dr. Sharma`;
}

// Persist sidebar collapsed state across reloads
function restoreSidebarState() {
    if (els.sidebar && window.innerWidth > 900) {
        const wasCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (wasCollapsed) els.sidebar.classList.add('collapsed');
    }
}

// ============================================
// EVENT BINDINGS
// ============================================
function bindEvents() {
    // Sidebar toggle (hamburger) — desktop collapse / mobile open
    if (els.sidebarToggle) els.sidebarToggle.addEventListener('click', toggleSidebar);

    // Mobile: dedicated "open sidebar" button in the top bar
    if (els.mobileSidebarBtn) {
        els.mobileSidebarBtn.addEventListener('click', openMobileSidebar);
    }

    // Overlay closes sidebar + context panel
    els.mobileOverlay?.addEventListener('click', closePanels);

    // History section collapse
    if (els.historyToggle && els.sidebarHistory) {
        els.historyToggle.addEventListener('click', toggleHistory);
    }

    // Auto-expand sidebar when search is focused while collapsed (desktop)
    if (els.patientSearch) {
        els.patientSearch.addEventListener('focus', () => {
            if (els.sidebar && window.innerWidth > 900 && els.sidebar.classList.contains('collapsed')) {
                els.sidebar.classList.remove('collapsed');
                localStorage.setItem('sidebarCollapsed', 'false');
            }
        });
    }

    // New Patient
    els.newPatientBtn?.addEventListener('click', openAddPatientModal);

    // Patient list (event delegation)
    els.patientList?.addEventListener('click', handlePatientClick);

    // Search
    els.patientSearch?.addEventListener('input', handlePatientSearch);
    els.patientSelectBtn?.addEventListener('click', togglePatientDropdown);
    els.topPatientSearch?.addEventListener('input', handleTopPatientSearch);
    els.topPatientSearch?.addEventListener('focus', handleTopPatientSearch);
    els.addPatientClose?.addEventListener('click', closeAddPatientModal);
    els.addPatientCancel?.addEventListener('click', closeAddPatientModal);
    els.addPatientOverlay?.addEventListener('click', (e) => {
        if (e.target === els.addPatientOverlay) closeAddPatientModal();
    });
    els.addPatientForm?.addEventListener('submit', createPatientFromForm);
    document.addEventListener('click', handleGlobalPatientControlClick);

    // Prompt actions
    els.generateBtn.addEventListener('click', handlePromptSubmit);
    els.chatSendBtn.addEventListener('click', handleChatSubmit);
    els.uploadBtn.addEventListener('click', () => els.fileInput.click());
    els.chatUploadBtn.addEventListener('click', () => els.fileInput.click());
    els.voiceBtn.addEventListener('click', handleVoice);
    els.fileInput.addEventListener('change', handleFileUpload);

    document.getElementById('logoutTopBtn')?.addEventListener('click', handleLogout);

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
        dropZone?.classList.add('dragover');
    });
    document.addEventListener('dragleave', (e) => {
        if (!e.relatedTarget || !dropZone.contains(e.relatedTarget)) {
            dropZone?.classList.remove('dragover');
        }
    });
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone?.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            simulateReportUpload(e.dataTransfer.files[0].name);
        }
    });

    if (els.contextPanelClose && els.contextPanel) {
        els.contextPanelClose.addEventListener('click', () => {
            els.contextPanel.classList.remove('visible');
        });
    }

    $$('.quick-action-card').forEach((card, i) => {
        card.addEventListener('click', () => {
            if (i === 0) els.fileInput.click();
            else simulateReportUpload('clinical_report.pdf');
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
    if (!els.sidebar) return;
    if (window.innerWidth <= 900) {
        // Mobile: the hamburger inside the (open) sidebar closes it
        els.sidebar.classList.remove('visible');
        els.mobileOverlay.classList.add('hidden');
    } else {
        // Desktop: collapse / expand
        const isNowCollapsed = els.sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', isNowCollapsed);
    }
}

function openMobileSidebar() {
    if (!els.sidebar) return;
    els.sidebar.classList.add('visible');
    els.mobileOverlay.classList.remove('hidden');
}

function closePanels() {
    els.sidebar?.classList.remove('visible');
    els.contextPanel?.classList.remove('visible');
    els.mobileOverlay?.classList.add('hidden');
}

// ============================================
// HISTORY SECTION TOGGLE
// ============================================
function toggleHistory() {
    els.sidebarHistory?.classList.toggle('history-collapsed');
}

// ============================================
// PATIENT MANAGEMENT
// ============================================
function getActivePatientRecord() {
    return state.activePatientId ? PATIENT_RECORDS[state.activePatientId] : null;
}

function getPatientContextDetails(record = getActivePatientRecord()) {
    if (!record) {
        return {
            name: 'New Patient', age: '', gender: '', height: '', weight: '', bmi: '',
            conditions: '', medications: '', allergies: '', foodPreference: 'Vegetarian',
            cuisinePreference: 'Mixed', likes: '', dislikes: '', mealsPerDay: '5 meals',
            eatsRegularly: '', routine: '', activityLevel: 'Moderate', mealTimings: '',
            waterIntake: '', restrictions: [], doctorNotes: ''
        };
    }
    if (!record.contextDetails) {
        const conditionTags = record.contextTags.filter(tag => !['Vegetarian', 'Non Vegetarian', 'Vegan', 'Eggetarian', 'Jain', 'Other', 'Low Sodium', 'Sugar Control', 'High Fiber', 'Heart Healthy', 'Low GI', 'High Protein'].includes(tag));
        record.contextDetails = {
            name: record.name,
            age: String(record.age),
            gender: record.gender,
            height: record.height || (record.gender === 'Female' ? '158 cm' : '170 cm'),
            weight: record.weight || (Number(record.bmi) > 28 ? '82 kg' : '71 kg'),
            bmi: record.bmi,
            conditions: conditionTags.length ? conditionTags.join(', ') : record.riskFlags.slice(0, 2).join(', '),
            medications: record.medications || 'Metformin as advised, antihypertensive review pending',
            allergies: record.allergies || 'None reported',
            foodPreference: record.contextTags.find(tag => ['Vegetarian', 'Non Vegetarian', 'Vegan', 'Eggetarian', 'Jain'].includes(tag)) || 'Vegetarian',
            cuisinePreference: record.cuisinePreference || 'Mixed',
            likes: record.likes || 'Home-cooked meals, dal, seasonal vegetables',
            dislikes: record.dislikes || 'Deep fried foods, sugary drinks',
            eatsRegularly: record.eatsRegularly || 'Chapati, dal, rice, seasonal vegetables, curd',
            mealsPerDay: record.mealsPerDay || '5',
            routine: record.routine || 'Moderate activity, office routine, evening walk when possible',
            activityLevel: record.activityLevel || 'Moderate',
            mealTimings: record.mealTimings || 'Breakfast 8 AM, lunch 1 PM, dinner 8 PM',
            waterIntake: record.waterIntake || '2.2 L/day',
            restrictions: [...record.restrictions],
            doctorNotes: record.clinicalNotes.join(' ')
        };
    }
    return record.contextDetails;
}

function deriveContextTagsFromDetails(details) {
    const tags = [];
    if (details.foodPreference) tags.push(details.foodPreference);
    details.conditions.split(',').map(v => v.trim()).filter(Boolean).forEach(v => tags.push(v));
    (details.restrictions || []).forEach(v => tags.push(v));
    if (/sugar|diabet/i.test(`${details.conditions} ${details.restrictions?.join(' ')}`)) tags.push('Sugar Control');
    return [...new Set(tags)].slice(0, 8);
}

function resetClinicalState() {
    state.planGenerated = false;
    state.planApproved = false;
    state.uploadedFiles = [];
    state.uploadState = 'idle';
    state.selectedPreferences = {
        diet: [], allergies: [], conditions: [],
        cuisine: [], activity: null, goals: [], notes: ''
    };
}

function getPatientEntries() {
    return Object.entries(PATIENT_RECORDS);
}

function renderPatientSelector() {
    if (!els.patientDropdownMenu) return;
    const activeId = state.activePatientId || '1';
    els.patientDropdownMenu.innerHTML = `
        <div class="patient-dropdown-list">
            ${getPatientEntries().map(([id, record]) => createPatientOptionHTML(id, record, id === activeId)).join('')}
        </div>
        <button class="patient-add-option" data-action="add-patient" type="button">+ Add New Patient</button>
    `;
    els.patientDropdownMenu.querySelectorAll('.patient-option').forEach(option => {
        option.addEventListener('click', () => {
            selectPatientRecord(option.dataset.id);
            closePatientDropdown();
        });
    });
    els.patientDropdownMenu.querySelector('[data-action="add-patient"]')?.addEventListener('click', () => {
        closePatientDropdown();
        openAddPatientModal();
    });
}

function createPatientOptionHTML(id, record, active = false) {
    return `
        <button class="patient-option${active ? ' active' : ''}" data-id="${id}" type="button" role="option" aria-selected="${active}">
            <span class="patient-option-avatar">${record.initials}</span>
            <span class="patient-option-main">
                <strong>${record.name}</strong>
                <small>${record.gender} · ${record.age} yrs · ${record.risk}</small>
            </span>
            <span class="patient-option-date">${record.lastActive}</span>
        </button>
    `;
}

function updateTopPatientControl(record) {
    if (!record) return;
    if (els.topPatientAvatar) els.topPatientAvatar.textContent = record.initials;
    if (els.topPatientLabel) els.topPatientLabel.textContent = record.name;
    renderPatientSelector();
}

function togglePatientDropdown() {
    if (!els.patientDropdownMenu) return;
    const isOpen = !els.patientDropdownMenu.classList.toggle('hidden');
    els.patientSelectBtn?.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) renderPatientSelector();
}

function closePatientDropdown() {
    els.patientDropdownMenu?.classList.add('hidden');
    els.patientSelectBtn?.setAttribute('aria-expanded', 'false');
}

function handleTopPatientSearch() {
    if (!els.topPatientSearch || !els.patientSearchResults) return;
    const query = els.topPatientSearch.value.trim().toLowerCase();
    if (!query) {
        els.patientSearchResults.classList.add('hidden');
        els.patientSearchResults.innerHTML = '';
        return;
    }
    const matches = getPatientEntries().filter(([, record]) => record.name.toLowerCase().includes(query));
    els.patientSearchResults.innerHTML = matches.length
        ? matches.map(([id, record]) => createPatientOptionHTML(id, record, id === state.activePatientId)).join('')
        : `<div class="patient-no-result"><strong>No patient found</strong><button type="button" data-action="add-patient">Create new patient</button></div>`;
    els.patientSearchResults.classList.remove('hidden');
    els.patientSearchResults.querySelectorAll('.patient-option').forEach(option => {
        option.addEventListener('click', () => {
            selectPatientRecord(option.dataset.id);
            els.topPatientSearch.value = '';
            els.patientSearchResults.classList.add('hidden');
        });
    });
    els.patientSearchResults.querySelector('[data-action="add-patient"]')?.addEventListener('click', openAddPatientModal);
}

function handleGlobalPatientControlClick(e) {
    if (!e.target.closest('.patient-select-wrap')) closePatientDropdown();
    if (!e.target.closest('.patient-search-wrap')) els.patientSearchResults?.classList.add('hidden');
}

function openAddPatientModal() {
    els.addPatientOverlay?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => els.addPatientForm?.querySelector('input[name="name"]')?.focus(), 80);
}

function closeAddPatientModal() {
    els.addPatientOverlay?.classList.add('hidden');
    els.addPatientForm?.reset();
    document.body.style.overflow = '';
}

function createPatientFromForm(e) {
    e.preventDefault();
    const data = new FormData(els.addPatientForm);
    const name = String(data.get('name') || '').trim();
    if (!name) return;
    const id = String(Math.max(...Object.keys(PATIENT_RECORDS).map(Number)) + 1);
    const initials = name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
    const age = Number(data.get('age')) || 40;
    const gender = data.get('gender') || 'Female';
    const condition = String(data.get('condition') || 'Initial Intake').trim() || 'Initial Intake';
    const diet = data.get('diet') || 'Vegetarian';
    const notes = String(data.get('notes') || 'New patient intake created by doctor.').trim();
    PATIENT_RECORDS[id] = {
        patientId: `NC-${Math.floor(10000 + Math.random() * 89999)}`,
        name, initials, age, gender, bmi: '—',
        risk: 'Pending Review', riskClass: 'warning', lastActive: 'Just now', lastUpdated: 'Just now',
        reports: [], workflowState: 'noReport', planStatus: 'No Diet Plan Generated',
        contextTags: [diet, condition],
        restrictions: ['Awaiting Report'],
        riskFlags: ['No uploaded report'],
        clinicalNotes: [notes],
        biomarkers: [],
        markerValues: {},
        messages: []
    };
    closeAddPatientModal();
    selectPatientRecord(id);
}

function startNewPatient() {
    openAddPatientModal();
}

function handlePatientClick(e) {
    const item = e.target.closest('.patient-item');
    if (!item) return;
    const record = PATIENT_RECORDS[item.dataset.id];
    if (!record) return;

    $$('.patient-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');

    selectPatientRecord(item.dataset.id);

    if (window.innerWidth <= 900) closePanels();
}

function selectPatientRecord(patientId) {
    const record = PATIENT_RECORDS[patientId];
    if (!record) return;
    state.currentPatient = patientId;
    state.activePatientId = patientId;
    updateTopPatientControl(record);
    const loadToken = ++state.patientLoadToken;
    closeContextReviewModal();
    closeBiomarkerDrawer();
    closeDietPlanModal();

    els.welcomeState.classList.add('hidden');
    els.uploadReviewState.classList.add('hidden');
    els.chatState.classList.remove('hidden');
    els.chatMessages.innerHTML = createPatientRecordLoadingHTML(record);

    setTimeout(() => {
        if (state.patientLoadToken !== loadToken || state.activePatientId !== patientId) return;
        applyPatientRecordState(record);
        renderPatientWorkspace(record);
    }, 420);
}

function applyPatientRecordState(record) {
    resetClinicalState();
    state.uploadedFiles = [...record.reports];
    state.planGenerated = record.workflowState === 'dietPlanReady';
    state.planApproved = Boolean(record.planApproved);
    const workflowToUploadState = {
        noReport: 'idle',
        reportUploaded: 'review',
        reportProcessed: 'complete',
        contextReviewed: 'complete',
        dietPlanReady: 'complete'
    };
    state.uploadState = workflowToUploadState[record.workflowState] || 'idle';
}

function createPatientRecordLoadingHTML(record) {
    return `
        <div class="patient-record-loading" role="status">
            <div class="patient-record-spinner"></div>
            <div>
                <strong>Loading patient record...</strong>
                <span>${record.name} · ${record.patientId}</span>
            </div>
        </div>
    `;
}

function createPatientWorkspaceHeader(record) {
    const planClass = record.workflowState === 'dietPlanReady' ? 'ready' : 'pending';
    return `
        <section class="patient-workspace-header" aria-label="${record.name} clinical workspace">
            <div class="pwh-main">
                <div class="pwh-avatar">${record.initials}</div>
                <div>
                    <div class="pwh-title-row">
                        <h2>${record.name}</h2>
                        <span class="pwh-risk ${record.riskClass}">${record.risk}</span>
                    </div>
                    <p>${record.gender} · ${record.age} yrs · BMI ${record.bmi} &nbsp;|&nbsp; Patient ID ${record.patientId}</p>
                </div>
            </div>
            <div class="pwh-status">
                <span class="pwh-connected"><i></i> Connected</span>
                <span class="pwh-plan ${planClass}">${record.planStatus}</span>
                <small>Synced just now</small>
            </div>
        </section>
    `;
}

function createPatientEmptyState(record) {
    return `
        <div class="patient-workspace-empty">
            <span class="workspace-state-label">Clinical Intake</span>
            <h3>No report available for ${record.name}</h3>
            <p>Upload a clinical report or add review notes to begin this patient workspace.</p>
            <button class="workspace-upload-btn" id="recordUploadBtn">Upload Clinical Report</button>
        </div>
    `;
}

function createPatientWorkflowNote(record) {
    if (record.workflowState === 'contextReviewed') {
        return `<div class="workspace-status-banner success">Patient context reviewed · Generate the clinical diet plan when ready.</div>`;
    }
    return '';
}

function renderPatientWorkspace(record) {
    els.welcomeState.classList.add('hidden');
    els.uploadReviewState.classList.add('hidden');
    els.uploadReviewContent.innerHTML = '';
    els.chatState.classList.remove('hidden');
    els.chatMessages.innerHTML = createPatientWorkspaceHeader(record);
    if (record.reports.length) showReportAttachments(record.reports);

    state.isRenderingRecord = true;
    record.messages.forEach(message => addMessage(message.sender === 'doctor' ? 'user' : 'ai', message.text, false, false));
    state.isRenderingRecord = false;

    if (record.workflowState === 'noReport') {
        els.chatMessages.insertAdjacentHTML('beforeend', createPatientEmptyState(record));
        document.getElementById('recordUploadBtn')?.addEventListener('click', () => els.fileInput.click());
    } else if (record.workflowState === 'reportUploaded') {
        addAIMessage(createSingleUploadCard(record.reports[0]));
        bindReviewCardButtons();
    } else {
        addAIMessage(createReviewHub());
        bindReviewHubButtons();
        if (record.workflowState === 'contextReviewed') {
            const contextButton = document.getElementById('openContextReviewBtn');
            if (contextButton) {
                contextButton.textContent = '✓ Reviewed';
                contextButton.classList.add('rh-btn-approved');
            }
            document.querySelector('.review-hub-cards')?.insertAdjacentHTML('afterend', createPatientWorkflowNote(record));
        }
    }
    scrollChatToBottom();
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
    const activeRecord = getActivePatientRecord();
    if (activeRecord && !activeRecord.reports.includes(filename)) {
        activeRecord.reports.push(filename);
        activeRecord.workflowState = 'reportUploaded';
        activeRecord.planStatus = 'Analysis Pending';
    }

    if (!state.uploadedFiles.includes(filename)) state.uploadedFiles.push(filename);
    state.uploadState = 'review';
    els.welcomeState.classList.add('hidden');
    els.uploadReviewState.classList.add('hidden');
    transitionToChat();
    showReportAttachments([filename]);
    addAIMessage(createSingleUploadCard(filename));
    bindReviewCardButtons();
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
            <p class="upload-action-subtitle">Report added to patient intake. Add supporting reports or begin clinical analysis.</p>
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
                    Begin Clinical Analysis
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
            <div class="upload-action-title">${files.length} Reports Ready for Review</div>
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
                    Analyze ${files.length} Reports
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
    const processingPatientId = state.activePatientId;
    state.uploadState = 'processing';

    // Transition to chat
    els.uploadReviewState.classList.add('hidden');
    transitionToChat();

    // Show uploaded files as attachment chips (not chat bubbles)
    showReportAttachments(files);

    // Show staged processing card in AI message
    showTypingIndicator();
    setTimeout(() => {
        if (processingPatientId && processingPatientId !== state.activePatientId) return;
        removeTypingIndicator();
        const msgEl = addAIMessage(createProcessingStagesHTML(files));
        const stagesList = msgEl.querySelector('.processing-stages-list');
        if (stagesList) {
            animateProcessingStages(stagesList, () => {
                // After all stages complete, show review hub
                setTimeout(() => {
                    const processedRecord = processingPatientId ? PATIENT_RECORDS[processingPatientId] : null;
                    if (processedRecord) {
                        processedRecord.workflowState = 'reportProcessed';
                        processedRecord.planStatus = 'Recommendation Pending';
                    }
                    if (processingPatientId && processingPatientId !== state.activePatientId) return;
                    removeLastMessage();
                    addAIMessage(createExtractionMessage());
                    addAIMessage(createReviewHub());
                    state.uploadState = 'complete';
                    bindReviewHubButtons();
                    setTimeout(openContextReviewModal, 450);
                }, 500);
            });
        }
    }, 600);
}

function showReportAttachments(files) {
    const existing = els.chatMessages.querySelector('.report-attachments-row');
    if (existing && existing.textContent.replace(/\s+/g, ' ').includes(files.join(''))) return;
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
        <div class="report-attachments-label">Uploaded report</div>
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
                Clinical Analysis · ${count} report${count > 1 ? 's' : ''}
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
                    <span class="processing-stage-text">Identifying risk flags</span>
                </div>
                <div class="processing-stage-item" data-stage="4">
                    <div class="processing-stage-dot"></div>
                    <span class="processing-stage-text">Preparing patient context</span>
                </div>
                <div class="processing-stage-item" data-stage="5">
                    <div class="processing-stage-dot"></div>
                    <span class="processing-stage-text">Preparing diet recommendation</span>
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
    if (!els.contextEmpty || !els.contextReports || !els.contextReportsList) return;
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

function renderContextLoading(record) {
    if (!els.contextEmpty || !els.contextReports || !els.contextData || !els.contextReportsList) return;
    els.contextEmpty.classList.add('hidden');
    els.contextReports.classList.add('hidden');
    els.contextData.classList.add('hidden');
    els.contextReports.classList.remove('hidden');
    els.contextReportsList.innerHTML = `
        <div class="context-sync-loading">
            <span class="patient-record-spinner"></span>
            <div><strong>Loading patient record...</strong><small>${record.patientId}</small></div>
        </div>
    `;
}

function renderRightPatientContext(record) {
    if (!els.contextEmpty || !els.contextReports || !els.contextData) return;
    const details = getPatientContextDetails(record);
    els.contextEmpty.classList.add('hidden');
    els.contextReports.classList.add('hidden');
    els.contextData.classList.remove('hidden');

    document.getElementById('profileAvatar').textContent = record.initials;
    document.getElementById('profileName').textContent = details.name || record.name;
    document.getElementById('profileMeta').textContent = `${details.gender || record.gender} • ${details.age || record.age} yrs • BMI ${details.bmi || record.bmi}`;
    const badge = document.getElementById('profileBadge');
    badge.className = `profile-badge ${record.riskClass}`;
    badge.textContent = record.risk;

    document.getElementById('vitalsGrid').innerHTML = [
        ['Height', details.height || 'Not set'],
        ['Weight', details.weight || 'Not set'],
        ['Food Preference', details.foodPreference || 'Not set'],
        ['Cuisine', details.cuisinePreference || 'Not set'],
        ['Meals / Day', details.mealsPerDay || 'Not set'],
        ['Activity', details.routine || 'Not set']
    ].map(item => `
        <div class="context-summary-tile">
            <span class="context-summary-label">${item[0]}</span>
            <span class="context-summary-value">${item[1]}</span>
        </div>
    `).join('');

    document.getElementById('alertChips').innerHTML = deriveContextTagsFromDetails(details).map(tag => `
        <span class="alert-chip info">${tag}</span>
    `).join('');
    const notes = [
        details.conditions ? `Medical conditions: ${details.conditions}` : '',
        details.medications ? `Current medications: ${details.medications}` : '',
        details.allergies ? `Allergies: ${details.allergies}` : '',
        details.likes ? `Likes: ${details.likes}` : '',
        details.dislikes ? `Dislikes: ${details.dislikes}` : '',
        details.doctorNotes ? `Doctor notes: ${details.doctorNotes}` : ''
    ].filter(Boolean);
    document.getElementById('observationsList').innerHTML = notes.map(note => `
        <div class="observation-item">
            <span class="obs-dot"></span>
            <p>${note}</p>
        </div>
    `).join('');
    document.getElementById('restrictionChips').innerHTML = (details.restrictions || record.restrictions).map(tag => `
        <span class="restriction-chip">${tag}</span>
    `).join('');

    document.getElementById('panelBiomarkerCTA')?.remove();
    let footer = document.getElementById('contextSyncFooter');
    if (!footer) {
        footer = document.createElement('div');
        footer.className = 'context-sync-footer';
        footer.id = 'contextSyncFooter';
        els.contextData.appendChild(footer);
    }
    footer.innerHTML = `
        <span class="sync-indicator"><i></i> Record synced locally</span>
        <span>Patient context summary only</span>
        <span>Clinical context source: Doctor-filled local state</span>
        <small>Updated ${record.lastUpdated}</small>
    `;
    const workspacePlan = els.chatMessages.querySelector('.pwh-plan');
    if (workspacePlan) {
        workspacePlan.textContent = record.planStatus;
        workspacePlan.classList.toggle('ready', record.workflowState === 'dietPlanReady' || record.planApproved);
        workspacePlan.classList.toggle('pending', record.workflowState !== 'dietPlanReady' && !record.planApproved);
    }
}

// ============================================
// CHAT MANAGEMENT
// ============================================
function transitionToChat() {
    els.welcomeState.classList.add('hidden');
    els.chatState.classList.remove('hidden');
}

function addMessage(type, content, isFile = false, persist = true) {
    const msg = document.createElement('div');
    msg.className = type === 'user' ? 'message user-message' : 'message ai-message';

    const avatarClass = type === 'user' ? 'user' : 'ai';
    const avatarText = type === 'user' ? 'DS' : 'AI';
    const label = type === 'user' ? 'Doctor' : 'NutriCopilot';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msg.innerHTML = `
        <div class="message-avatar ${avatarClass}">${avatarText}</div>
        <div class="message-content">
            <div class="message-label">${label}<span>${time}</span></div>
            <div class="message-bubble">
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
        </div>
    `;

    els.chatMessages.appendChild(msg);
    const activeRecord = getActivePatientRecord();
    if (persist && activeRecord && !state.isRenderingRecord) {
        activeRecord.messages.push({ sender: type === 'user' ? 'doctor' : 'ai', text: content });
    }
    scrollChatToBottom();
}

function addAIMessage(htmlContent) {
    const msg = document.createElement('div');
    msg.className = 'message ai-message';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    msg.innerHTML = `
        <div class="message-avatar ai">AI</div>
        <div class="message-content">
            <div class="message-label">NutriCopilot<span>${time}</span></div>
            <div class="message-bubble">${htmlContent}</div>
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
    indicator.className = 'message ai-message typing-message';
    indicator.innerHTML = `
        <div class="message-avatar ai">AI</div>
        <div class="message-content">
            <div class="message-label">NutriCopilot</div>
            <div class="message-bubble">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
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
    const responsePatientId = state.activePatientId;
    showTypingIndicator();

    const responses = [
        "I've noted that. Let me adjust the dietary recommendations based on this information.",
        "Thank you for the clarification. I'll incorporate this into the personalized plan.",
        "Understood. This helps me refine the nutritional targets for optimal outcomes.",
        "Got it. I'll factor this into the meal structure and caloric distribution."
    ];

    setTimeout(() => {
        const response = responses[Math.floor(Math.random() * responses.length)];
        if (responsePatientId && responsePatientId !== state.activePatientId) {
            PATIENT_RECORDS[responsePatientId].messages.push({ sender: 'ai', text: response });
            return;
        }
        removeTypingIndicator();
        streamText(response, true, responsePatientId);
    }, 1500);
}

function streamText(text, persist = false, patientId = state.activePatientId) {
    const msg = document.createElement('div');
    msg.className = 'message ai-message';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    msg.innerHTML = `
        <div class="message-avatar ai">AI</div>
        <div class="message-content">
            <div class="message-label">NutriCopilot<span>${time}</span></div>
            <div class="message-bubble"><p class="streaming-text"></p></div>
        </div>
    `;
    els.chatMessages.appendChild(msg);
    if (persist && patientId && PATIENT_RECORDS[patientId]) {
        PATIENT_RECORDS[patientId].messages.push({ sender: 'ai', text });
    }

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
            Preparing report findings...
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
    const record = getActivePatientRecord();
    const metricValue = (label, fallback) => {
        const metric = record?.biomarkers.find(item => item[0] === label);
        return metric ? metric[1] : fallback;
    };
    const patientName = record ? `${record.name}, ${record.age}${record.gender.charAt(0)}` : 'Rajesh Sharma, 52M';
    const bmi = record ? record.bmi : '28.4';
    return `
        <p style="margin-bottom: 16px;">I've analyzed the patient report. Here's what I extracted:</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
            <div style="padding: 10px; background: var(--bg-tertiary); border-radius: 8px;">
                <span style="font-size: 11px; color: var(--text-tertiary); display: block;">Patient</span>
                <span style="font-size: 13px; font-weight: 500;">${patientName}</span>
            </div>
            <div style="padding: 10px; background: var(--bg-tertiary); border-radius: 8px;">
                <span style="font-size: 11px; color: var(--text-tertiary); display: block;">BMI</span>
                <span style="font-size: 13px; font-weight: 500; color: var(--color-warning-text);">${bmi}</span>
            </div>
            <div style="padding: 10px; background: var(--bg-tertiary); border-radius: 8px;">
                <span style="font-size: 11px; color: var(--text-tertiary); display: block;">HbA1c</span>
                <span style="font-size: 13px; font-weight: 500; color: var(--error);">${metricValue('HbA1c', '8.2%')}</span>
            </div>
            <div style="padding: 10px; background: var(--bg-tertiary); border-radius: 8px;">
                <span style="font-size: 11px; color: var(--text-tertiary); display: block;">BP</span>
                <span style="font-size: 13px; font-weight: 500; color: var(--color-warning-text);">${metricValue('BP', '142/92')}</span>
            </div>
            <div style="padding: 10px; background: var(--bg-tertiary); border-radius: 8px;">
                <span style="font-size: 11px; color: var(--text-tertiary); display: block;">Cholesterol</span>
                <span style="font-size: 13px; font-weight: 500; color: var(--error);">${metricValue('Cholesterol', '245 mg/dL')}</span>
            </div>
            <div style="padding: 10px; background: var(--bg-tertiary); border-radius: 8px;">
                <span style="font-size: 11px; color: var(--text-tertiary); display: block;">Vitamin D</span>
                <span style="font-size: 13px; font-weight: 500; color: var(--info);">${metricValue('Vitamin D', '12 ng/mL')}</span>
            </div>
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); padding: 10px; background: var(--warning-light); border-radius: 8px; border-left: 3px solid var(--warning);">
            ${record ? record.riskFlags[0] || 'Clinical findings require review.' : 'Patient shows signs of uncontrolled Type 2 Diabetes with hypertension. Dietary intervention is critical.'}
        </p>
    `;
}

// ============================================
// CONTEXT COLLECTION UI
// ============================================
function createContextCollectionUI() {
    return `
        <p style="margin-bottom: 16px;">Review patient context before preparing the clinical diet plan:</p>
        <div class="context-cards-container">
            <!-- Diet Preference -->
            <div class="context-card">
                <div class="context-card-title">Diet Preference</div>
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
                <div class="context-card-title">Medical Restrictions</div>
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
                <div class="context-card-title">Medical Conditions</div>
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
                <div class="context-card-title">Cuisine Preference</div>
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
                <div class="context-card-title">Activity Level</div>
                <div class="activity-chips" data-category="activity">
                    <span class="activity-chip" data-value="Sedentary">Sedentary</span>
                    <span class="activity-chip" data-value="Moderate">Moderate</span>
                    <span class="activity-chip" data-value="Active">Active</span>
                </div>
            </div>

            <!-- Goals -->
            <div class="context-card">
                <div class="context-card-title">Clinical Goals</div>
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
                <div class="context-card-title">Clinical Notes</div>
                <textarea class="context-textarea" placeholder="Any specific dietary preferences, timing constraints, cultural considerations..." id="additionalNotes"></textarea>
            </div>

            <button class="generate-plan-btn" id="generatePlanBtn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                </svg>
                Generate Clinical Diet Plan
            </button>
        </div>
    `;
}

// ============================================
// CONTEXT PANEL
// ============================================
function showContextPanel() {
    if (!els.contextEmpty || !els.contextReports || !els.contextData) return;
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
function getPlanPageHref(patientId = state.activePatientId) {
    return `diet-plan.html${patientId ? `?patientId=${encodeURIComponent(patientId)}` : ''}`;
}

function generateDietPlan() {
    const generationPatientId = state.activePatientId;
    collectPreferences();
    state.planGenerated = false;
    state.planApproved = false;
    removeGeneratedPlanCard();
    showTypingIndicator();

    const trigger = document.getElementById('proceedGenerateBtn') || document.getElementById('generatePlanBtn');
    if (trigger) {
        trigger.disabled = true;
        trigger.classList.add('is-generating');
        trigger.dataset.originalLabel = trigger.innerHTML;
        trigger.innerHTML = `
            <span class="btn-spinner"></span>
            Preparing Clinical Plan
        `;
    }

    setTimeout(() => {
        const activeRecord = generationPatientId ? PATIENT_RECORDS[generationPatientId] : getActivePatientRecord();
        if (activeRecord) {
            activeRecord.workflowState = 'dietPlanReady';
            activeRecord.planStatus = 'Clinical Diet Plan Ready';
        }
        if (generationPatientId && generationPatientId !== state.activePatientId) return;
        state.planGenerated = true;
        removeTypingIndicator();
        addAIMessage(createPlanReadyChatCard(activeRecord, generationPatientId));
        renderGeneratedPlanCard();
        showPlanSuccessToast(activeRecord, generationPatientId);
        if (trigger) {
            trigger.disabled = false;
            trigger.classList.remove('is-generating');
            trigger.innerHTML = trigger.dataset.originalLabel || 'Generate Clinical Diet Plan';
        }
    }, 1900);
}

function createPlanReadyChatCard(record, patientId = state.activePatientId) {
    const details = getPatientContextDetails(record);
    const patientName = details.name || record?.name || 'Selected patient';
    const risk = record?.risk || 'Doctor Review';
    const meals = details.mealsPerDay ? `${String(details.mealsPerDay).replace(' meals', '')} meals/day` : '6 meals/day';
    const diet = details.foodPreference || 'Vegetarian';
    const href = getPlanPageHref(patientId);
    return `
        <article class="plan-ready-card">
            <div class="plan-ready-card__header">
                <div class="plan-ready-card__icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20,6 9,17 4,12"/>
                    </svg>
                </div>
                <div>
                    <h3>Weekly Diet Plan Generated</h3>
                    <p>Generated using report findings + saved patient context.</p>
                </div>
            </div>
            <div class="plan-ready-card__body">
                <div class="plan-ready-meta">
                    <span><strong>Patient</strong>${patientName}</span>
                    <span><strong>Risk level</strong><em>${risk}</em></span>
                    <span><strong>Meal frequency</strong>${meals}</span>
                    <span><strong>Diet preference</strong>${diet}</span>
                </div>
                <div class="plan-ready-focus">
                    <span>Low GI</span>
                    <span>Low Sodium</span>
                    <span>Diabetes Friendly</span>
                    <span>High Fiber</span>
                </div>
                <div class="plan-ready-grid">
                    <span>7-day plan created</span>
                    <span>Editable meal schedule</span>
                    <span>Alternatives included</span>
                    <span>Ready for doctor review</span>
                </div>
                <p class="plan-ready-copy">
                    The weekly clinical nutrition plan has been created using medical report findings, patient allergies and food preferences, daily routine, meal frequency, and clinical restrictions.
                </p>
                <div class="plan-ready-actions">
                    <a class="view-plan-btn" href="${href}">View Plan →</a>
                    <button class="modify-context-btn" type="button" data-action="modify-context">Modify Context</button>
                </div>
            </div>
        </article>
    `;
}

function showPlanSuccessToast(record, patientId = state.activePatientId) {
    document.getElementById('planSuccessToast')?.remove();
    const toast = document.createElement('div');
    toast.className = 'plan-success-toast';
    toast.id = 'planSuccessToast';
    toast.innerHTML = `
        <div class="plan-success-toast__mark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20,6 9,17 4,12"/>
            </svg>
        </div>
        <div class="plan-success-toast__body">
            <h3>Weekly diet plan generated</h3>
            <p>The plan is ready for doctor review. Open the review page to edit meals, compare alternatives, approve, or export.</p>
            <div class="plan-success-toast__actions">
                <a class="toast-view-plan-btn" href="${getPlanPageHref(patientId)}">View Plan</a>
                <button class="toast-dismiss-btn" type="button">Dismiss</button>
            </div>
        </div>
    `;
    document.body.appendChild(toast);
    toast.querySelector('.toast-dismiss-btn')?.addEventListener('click', () => dismissPlanToast(toast));
    window.clearTimeout(state.planToastTimer);
    state.planToastTimer = window.setTimeout(() => dismissPlanToast(toast), 6500);
}

function dismissPlanToast(toast = document.getElementById('planSuccessToast')) {
    if (!toast) return;
    toast.classList.add('is-hiding');
    setTimeout(() => toast.remove(), 240);
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
    const record = getActivePatientRecord();
    return `
        <p style="margin-bottom: 8px;">Clinical diet plan prepared for doctor review: <strong>${record ? record.name : 'Rajesh Sharma'}</strong></p>
        <p style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 16px;">
            Optimized for: Sugar Control • Heart Healthy • Low Sodium • High Fiber
        </p>
        <div class="diet-plan-container">
            <div class="meal-card" style="animation-delay: 0.1s">
                <div class="meal-card-header">
                    <div class="meal-card-title">
                        <div class="meal-time-icon" style="background: #FFF8D8;">🌅</div>
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
                        <div class="meal-time-icon" style="background: #FFF8D8;">🍳</div>
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
                        <div class="meal-time-icon" style="background: #EAF4FA;">🍎</div>
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
                        <div class="meal-time-icon" style="background: #EAF8F6;">🥗</div>
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
                        <div class="meal-time-icon" style="background: #F2F8FB;">☕</div>
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
                        <div class="meal-time-icon" style="background: #EAF4FA;">🌙</div>
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
                        <div class="meal-time-icon" style="background: #EAF4FA;">💧</div>
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
                    <span>Nutrition prescription approved by Dr. Sharma • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
    if (e.target.closest('[data-action="modify-context"]')) {
        openContextReviewModal();
        return;
    }

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

function getPatientBiomarkerData() {
    const record = getActivePatientRecord();
    if (!record || !Object.keys(record.markerValues || {}).length) return BIOMARKER_DATA;
    return Object.fromEntries(Object.entries(BIOMARKER_DATA).map(([key, group]) => [
        key,
        {
            ...group,
            markers: group.markers.map(marker => {
                const override = record.markerValues[marker.name];
                return override ? {
                    ...marker,
                    value: override[0],
                    status: override[1],
                    position: override[2],
                    source: record.reports[0] || marker.source
                } : { ...marker, source: record.reports[0] || marker.source };
            })
        }
    ]));
}

// ============================================
// REVIEW HUB (post-processing landing)
// ============================================
function getPatientContextSummary() {
    const record = getActivePatientRecord();
    if (record) {
        const details = getPatientContextDetails(record);
        const tags = deriveContextTagsFromDetails(details);
        return {
            diet: details.foodPreference ? [details.foodPreference] : [],
            conditions: details.conditions ? details.conditions.split(',').map(v => v.trim()).filter(Boolean) : [],
            cuisine: details.cuisinePreference ? [details.cuisinePreference] : [],
            goals: tags.filter(tag => ![details.foodPreference, details.cuisinePreference].includes(tag)).slice(0, 4),
            allergies: details.allergies && details.allergies !== 'None reported' ? [details.allergies] : [],
            activity: details.routine,
            notes: details.doctorNotes
        };
    }
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
    const record = getActivePatientRecord();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const planHref = getPlanPageHref(state.activePatientId);
    return `
        <div class="review-hub-card rh-diet-plan rh-diet-plan-success rh-plan-appear" id="generatedPlanCard">
            <div class="rh-success-head">
                <div class="rh-success-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20,6 9,17 4,12"/>
                    </svg>
                </div>
                <div class="rh-card-body">
                    <div class="rh-plan-ready-title">Clinical Diet Plan Ready${record ? ` · ${record.name}` : ''}</div>
                    <div class="rh-plan-ready-sub">Review before approval · Doctor editable</div>
                    <div class="rh-plan-metrics" aria-label="Clinical nutrition summary">
                        <span><strong>1720</strong><small>kcal</small></span>
                        <span><strong>93g</strong><small>Protein</small></span>
                        <span><strong>186g</strong><small>Carbs</small></span>
                        <span><strong>34g</strong><small>Fiber</small></span>
                    </div>
                    <div class="rh-plan-preview-list">
                        <span class="rh-preview-item">Morning schedule</span>
                        <span class="rh-preview-item">Lunch prescription</span>
                        <span class="rh-preview-item">Evening snack</span>
                        <span class="rh-preview-item">Dinner schedule</span>
                        <span class="rh-preview-item">Bedtime support</span>
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
            <a class="rh-review-plan-btn" id="openGeneratedPlanBtn" href="${planHref}">
                View Plan
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </a>
        </div>
    `;
}

function createReviewHub() {
    const record = getActivePatientRecord();
    const biomarkerData = getPatientBiomarkerData();
    const totalMarkers = Object.values(biomarkerData).reduce((s, g) => s + g.markers.length, 0);
    const abnormalMarkers = Object.values(biomarkerData).reduce((s, g) => {
        return s + g.markers.filter(m => m.status !== 'normal').length;
    }, 0);

    return `
        <div class="review-hub">
            <p class="review-hub-intro">Report findings are ready${record ? ` for ${record.name}` : ''}. Review patient biomarkers and clinical context before preparing a nutrition prescription.</p>
            <div class="report-findings-grid">
                <div class="report-finding-card">
                    <span class="report-finding-label">Biomarker Summary</span>
                    <strong>${totalMarkers} markers extracted</strong>
                    <p>${abnormalMarkers} values need doctor review before nutrition planning.</p>
                </div>
                <div class="report-finding-card warning">
                    <span class="report-finding-label">Abnormal Values</span>
                    <strong>${record?.biomarkers?.filter(item => item[2] !== 'normal').slice(0, 3).map(item => `${item[0]} ${item[1]}`).join(' · ') || 'HbA1c 8.2% · BP 142/92'}</strong>
                    <p>Use clinical judgment before plan approval.</p>
                </div>
                <div class="report-finding-card ${record?.riskClass === 'critical' ? 'critical' : ''}">
                    <span class="report-finding-label">Risk Flags</span>
                    <strong>${record?.riskFlags?.slice(0, 2).join(' · ') || 'Diabetes · Hypertension'}</strong>
                    <p>Escalate clinically before approving nutrition recommendations.</p>
                </div>
            </div>
            <div class="review-hub-cards">
                <div class="review-hub-card rh-biomarkers">
                    <div class="rh-card-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5m4 0h4m6-11v11m0 0h-4m4 0H9"/>
                        </svg>
                    </div>
                    <div class="rh-card-body">
                        <div class="rh-card-title">Patient Biomarkers</div>
                        <div class="rh-card-meta">
                            <span>${totalMarkers} detected</span>
                            <span class="rh-badge rh-badge-abnormal">${abnormalMarkers} abnormal</span>
                        </div>
                    </div>
                    <button class="rh-review-btn" id="openBiomarkersBtn">Review Findings →</button>
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
                    <button class="rh-review-btn" id="openContextReviewBtn">Review Context →</button>
                </div>
                ${state.planGenerated ? createGeneratedDietPlanCard() : ''}
            </div>
            <div class="ctx-review-section hidden" id="ctxReviewSection"></div>
            ${!state.planGenerated ? `
            <div class="rh-generate-row">
                <p class="rh-generate-hint">Review before approval · Doctor remains in control.</p>
                <button class="rh-generate-btn" id="proceedGenerateBtn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                    </svg>
                    Complete Context & Generate
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
        if (openPlanBtn) openPlanBtn.onclick = null;
    }, 100);
}

function proceedToGenerate() {
    openContextReviewModal();
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
    const biomarkerData = getPatientBiomarkerData();
    const total = Object.values(biomarkerData).reduce((sum, group) => sum + group.markers.length, 0);
    const abnormal = Object.values(biomarkerData).reduce((sum, group) => sum + group.markers.filter(marker => marker.status !== 'normal').length, 0);
    const title = overlay.querySelector('.bm-drawer-title-block h3');
    const totalEl = overlay.querySelector('.bm-total-count');
    const abnormalEl = overlay.querySelector('.bm-abnormal-count');
    const record = getActivePatientRecord();
    if (title) title.textContent = record ? `${record.name} Biomarkers` : 'Extracted Biomarkers';
    if (totalEl) totalEl.textContent = `${total} detected`;
    if (abnormalEl) abnormalEl.textContent = `${abnormal} abnormal`;
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
    document.removeEventListener('keydown', handleBiomarkerEsc);
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
    document.addEventListener('keydown', handleBiomarkerEsc);
}

function handleBiomarkerEsc(e) {
    if (e.key === 'Escape') {
        closeBiomarkerDrawer();
        document.removeEventListener('keydown', handleBiomarkerEsc);
    }
}

function handleLogout() {
    ['sidebarCollapsed'].forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
    window.location.href = 'landing.html';
}

function renderBiomarkerGroup(groupKey) {
    const body = document.getElementById('bmDrawerBody');
    const group = getPatientBiomarkerData()[groupKey];
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
// PATIENT CONTEXT REVIEW MODAL
// ============================================
function toggleContextReview() {
    openContextReviewModal();
}

function _contextReviewEscHandler(e) {
    if (e.key === 'Escape') closeContextReviewModal();
}

function openContextReviewModal() {
    const overlay = document.getElementById('contextReviewOverlay');
    const body = document.getElementById('contextReviewModalBody');
    if (!overlay || !body) return;
    state.contextWizardStep = 0;
    state.contextWizardData = createWizardDataFromRecord(getActivePatientRecord());
    renderContextWizard();
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
        overlay.classList.add('context-review-open');
        overlay.querySelector('.context-review-dialog')?.classList.add('context-review-dialog-open');
    });
    const closeBtn = document.getElementById('contextReviewClose');
    if (closeBtn) closeBtn.onclick = closeContextReviewModal;
    overlay.onclick = (e) => { if (e.target === overlay) closeContextReviewModal(); };
    document.addEventListener('keydown', _contextReviewEscHandler);
    setTimeout(() => document.getElementById('contextReviewClose')?.focus(), 160);
}

function closeContextReviewModal() {
    const overlay = document.getElementById('contextReviewOverlay');
    if (!overlay) return;
    overlay.classList.remove('context-review-open');
    overlay.querySelector('.context-review-dialog')?.classList.remove('context-review-dialog-open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', _contextReviewEscHandler);
    setTimeout(() => overlay.classList.add('hidden'), 220);
}

function renderContextReviewActions() {
    const footer = document.getElementById('ctxReviewFooter');
    if (!footer) return;
    const isFirst = state.contextWizardStep === 0;
    const isFinal = state.contextWizardStep === CONTEXT_WIZARD_STEPS.length - 1;
    footer.innerHTML = `
        <div class="wizard-footer-note">
            <span>${isFinal ? 'Ready for doctor review' : 'Patient-specific context will shape the generated plan'}</span>
        </div>
        <button class="ctx-cancel-btn" id="contextReviewCancel" type="button">${isFirst ? 'Cancel' : 'Back'}</button>
        ${!isFinal ? `
            <button class="ctx-skip-btn" id="ctxSkipBtn" type="button">Skip</button>
            <button class="ctx-approve-btn" id="ctxNextBtn" type="button">Next</button>
        ` : `
            <button class="ctx-skip-btn" id="ctxSaveDraftBtn" type="button">Save Draft</button>
            <button class="ctx-approve-btn" id="ctxApproveBtn" type="button">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
                Save & Generate Diet Plan
            </button>
        `}
    `;
}

function createWizardDataFromRecord(record) {
    const details = getPatientContextDetails(record);
    const splitList = (value) => Array.isArray(value)
        ? value
        : String(value || '').split(',').map(item => item.trim()).filter(Boolean);
    const restrictions = details.restrictions || record?.restrictions || [];
    return {
        patient: {
            name: details.name || record?.name || '',
            age: details.age || String(record?.age || ''),
            gender: details.gender || record?.gender || '',
            height: details.height || '',
            weight: details.weight || '',
            bmi: details.bmi || record?.bmi || '',
            conditions: details.conditions || record?.contextTags?.filter(tag => !WIZARD_OPTIONS.diet.includes(tag)).join(', ') || '',
            medications: details.medications || ''
        },
        allergies: splitList(details.allergies && details.allergies !== 'None reported' ? details.allergies : ''),
        allergyOther: '',
        allergyNotes: '',
        dietType: details.foodPreference || 'Vegetarian',
        dietOther: '',
        regularFoods: splitList(details.eatsRegularly),
        likedFoods: splitList(details.likes),
        cuisines: details.cuisinePreference ? [details.cuisinePreference] : ['Mixed'],
        likedOther: '',
        avoidedFoods: splitList(details.dislikes),
        avoidedNotes: '',
        routine: details.routine || '',
        activityLevel: details.activityLevel || 'Moderately active',
        wakeTime: '06:30',
        sleepTime: '22:30',
        workType: 'Desk job',
        exerciseFrequency: '3-4 times/week',
        exerciseTypes: ['Walking'],
        mealsPerDay: String(details.mealsPerDay || '5').includes('meal') ? details.mealsPerDay : `${details.mealsPerDay || '5'} meals`,
        breakfastTime: '08:30',
        lunchTime: '13:00',
        dinnerTime: '20:00',
        snackPreference: 'Both',
        waterIntake: details.waterIntake || '2-3 L',
        hydrationReminder: 'Yes',
        clinicalGoals: restrictions.length ? restrictions.map(normalizeClinicalGoalLabel) : ['Diabetes control', 'Low sodium', 'High fiber'].filter(Boolean),
        doctorInstructions: details.doctorNotes || ''
    };
}

function normalizeClinicalGoalLabel(value) {
    const map = {
        'Low Sodium': 'Low sodium',
        'No Refined Sugar': 'Low sugar',
        'Low Saturated Fat': 'Low fat',
        'High Fiber': 'High fiber',
        'Diabetic-friendly': 'Diabetes control',
        'Heart healthy': 'Heart healthy',
        'Renal-friendly': 'Renal friendly'
    };
    return map[value] || value;
}

function renderContextWizard() {
    const body = document.getElementById('contextReviewModalBody');
    if (!body || !state.contextWizardData) return;
    const step = CONTEXT_WIZARD_STEPS[state.contextWizardStep];
    const header = document.querySelector('#contextReviewOverlay .context-review-header');
    if (header) header.classList.toggle('wizard-review-header', true);
    const title = document.getElementById('contextReviewTitle');
    if (title) title.textContent = 'Complete Patient Preferences';
    const headerText = document.querySelector('#contextReviewOverlay .context-review-header p');
    if (headerText) headerText.textContent = 'Guided intake for allergies, diet choices, routine, hydration, and clinical goals.';
    body.innerHTML = `
        <div class="patient-context-wizard" data-step="${step.id}">
            <div class="wizard-progress-wrap">
                <div class="wizard-progress-top">
                    <span>${step.eyebrow}</span>
                    <strong>${Math.round(((state.contextWizardStep + 1) / CONTEXT_WIZARD_STEPS.length) * 100)}% complete</strong>
                </div>
                <div class="wizard-progress-track">
                    <span style="width:${((state.contextWizardStep + 1) / CONTEXT_WIZARD_STEPS.length) * 100}%"></span>
                </div>
            </div>
            <section class="wizard-step-card">
                <div class="wizard-step-intro">
                    <span class="wizard-step-eyebrow">${step.eyebrow}</span>
                    <h3>${step.title}</h3>
                    <p>${step.subtitle}</p>
                </div>
                <div class="wizard-step-content wizard-step-${step.id}">
                    ${createWizardStepContent(step.id)}
                </div>
            </section>
        </div>
    `;
    renderContextReviewActions();
    bindContextReviewEvents();
}

function createWizardStepContent(stepId) {
    const data = state.contextWizardData || {};
    switch (stepId) {
        case 'allergies':
            return `
                ${createTileGrid(WIZARD_OPTIONS.allergies, data.allergies, { key: 'allergies', multi: true, visual: true, compact: true })}
                <label class="wizard-field ${data.allergies.includes('Other') ? '' : 'hidden'}" data-conditional="allergies:Other">
                    <span>Other allergy details</span>
                    <input data-wizard-field="allergyOther" value="${data.allergyOther || ''}" placeholder="Add allergy details">
                </label>
                <label class="wizard-field">
                    <span>Doctor notes on allergies</span>
                    <textarea data-wizard-field="allergyNotes" placeholder="Reaction severity, foods to avoid, or cross-contamination concerns">${data.allergyNotes || ''}</textarea>
                </label>
            `;
        case 'diet':
            return `
                ${createTileGrid(WIZARD_OPTIONS.diet, data.dietType, { key: 'dietType', multi: false, visual: true, large: true })}
                <label class="wizard-field ${data.dietType === 'Other' ? '' : 'hidden'}" data-conditional="dietType:Other">
                    <span>Other diet preference</span>
                    <input data-wizard-field="dietOther" value="${data.dietOther || ''}" placeholder="Describe diet preference">
                </label>
            `;
        case 'regularFoods':
            return createTileGrid(WIZARD_OPTIONS.regularFoods, data.regularFoods, { key: 'regularFoods', multi: true, visual: true });
        case 'likedFoods':
            return `
                ${createTileGrid(WIZARD_OPTIONS.likedFoods, data.likedFoods, { key: 'likedFoods', multi: true, visual: true })}
                <div class="wizard-subsection">
                    <span class="wizard-subtitle">Cuisine preference</span>
                    ${createChipGroup(WIZARD_OPTIONS.cuisines, data.cuisines, 'cuisines', true)}
                </div>
                <label class="wizard-field">
                    <span>Other preferred foods or cuisine</span>
                    <input data-wizard-field="likedOther" value="${data.likedOther || ''}" placeholder="Add any other preferred foods">
                </label>
            `;
        case 'avoidedFoods':
            return `
                ${createChipGroup(WIZARD_OPTIONS.avoidedFoods, data.avoidedFoods, 'avoidedFoods', true)}
                <label class="wizard-field">
                    <span>Manual entry</span>
                    <textarea data-wizard-field="avoidedNotes" placeholder="Add disliked foods, avoidances, cultural restrictions, or texture preferences">${data.avoidedNotes || ''}</textarea>
                </label>
            `;
        case 'routine':
            return `
                <div class="wizard-two-col">
                    <div class="wizard-subsection">${createChoiceBlock('Activity level', WIZARD_OPTIONS.activityLevels, data.activityLevel, 'activityLevel')}</div>
                    <div class="wizard-subsection">${createChoiceBlock('Work type', WIZARD_OPTIONS.workTypes, data.workType, 'workType')}</div>
                </div>
                <div class="wizard-form-row">
                    <label class="wizard-field"><span>Wake-up time</span><input type="time" data-wizard-field="wakeTime" value="${data.wakeTime || ''}"></label>
                    <label class="wizard-field"><span>Sleep time</span><input type="time" data-wizard-field="sleepTime" value="${data.sleepTime || ''}"></label>
                    <label class="wizard-field"><span>Exercise frequency</span><select data-wizard-field="exerciseFrequency">${WIZARD_OPTIONS.exerciseFrequency.map(option => `<option${option === data.exerciseFrequency ? ' selected' : ''}>${option}</option>`).join('')}</select></label>
                </div>
                <div class="wizard-subsection">
                    <span class="wizard-subtitle">Exercise type</span>
                    ${createChipGroup(WIZARD_OPTIONS.exerciseTypes, data.exerciseTypes, 'exerciseTypes', true)}
                </div>
                <label class="wizard-field">
                    <span>Daily routine details</span>
                    <textarea data-wizard-field="routine" placeholder="Clinic timings, travel, fasting pattern, caregiving duties, or shift notes">${data.routine || ''}</textarea>
                </label>
            `;
        case 'meals':
            return `
                ${createTileGrid(WIZARD_OPTIONS.mealsPerDay, data.mealsPerDay, { key: 'mealsPerDay', multi: false, visual: false, large: true })}
                <div class="wizard-form-row">
                    <label class="wizard-field"><span>Breakfast time</span><input type="time" data-wizard-field="breakfastTime" value="${data.breakfastTime || ''}"></label>
                    <label class="wizard-field"><span>Lunch time</span><input type="time" data-wizard-field="lunchTime" value="${data.lunchTime || ''}"></label>
                    <label class="wizard-field"><span>Dinner time</span><input type="time" data-wizard-field="dinnerTime" value="${data.dinnerTime || ''}"></label>
                </div>
                <div class="wizard-subsection">${createChoiceBlock('Snack preference', WIZARD_OPTIONS.snackPreference, data.snackPreference, 'snackPreference')}</div>
            `;
        case 'hydration':
            return `
                <div class="wizard-hydration-hero"><div class="wizard-water-visual"></div><div><strong>Hydration pattern</strong><span>Use this with clinical goals and activity level for fluid guidance.</span></div></div>
                ${createTileGrid(WIZARD_OPTIONS.waterIntake, data.waterIntake, { key: 'waterIntake', multi: false, visual: false })}
                <div class="wizard-subsection">${createChoiceBlock('Hydration reminders needed?', ['Yes', 'No'], data.hydrationReminder, 'hydrationReminder')}</div>
            `;
        case 'goals':
            return `
                ${createTileGrid(WIZARD_OPTIONS.clinicalGoals, data.clinicalGoals, { key: 'clinicalGoals', multi: true, visual: false })}
                <label class="wizard-field">
                    <span>Additional doctor instructions</span>
                    <textarea data-wizard-field="doctorInstructions" placeholder="Targets, restrictions, supplement notes, medication timing, or review instructions">${data.doctorInstructions || ''}</textarea>
                </label>
            `;
        case 'review':
            return createWizardReviewSummary();
        default:
            return '';
    }
}

function createTileGrid(options, selected, config = {}) {
    const values = Array.isArray(selected) ? selected : [selected].filter(Boolean);
    const classes = ['wizard-tile-grid'];
    if (config.large) classes.push('wizard-tile-grid-large');
    if (config.compact) classes.push('wizard-tile-grid-compact');
    return `<div class="${classes.join(' ')}">${options.map((option, index) => {
        const active = values.includes(option);
        const visualClass = option.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return `
            <button class="wizard-select-tile ${active ? 'selected' : ''}" type="button" data-wizard-select="${config.key}" data-value="${option}" data-multi="${config.multi ? 'true' : 'false'}">
                ${config.visual ? `<span class="wizard-tile-visual wizard-visual-${visualClass}"><i>${option.split(/[ /-]/).filter(Boolean).map(part => part[0]).join('').slice(0, 2)}</i></span>` : ''}
                <span>${option}</span>
                <small>${getTileHelper(option, index)}</small>
            </button>
        `;
    }).join('')}</div>`;
}

function createChipGroup(options, selected, key, multi = true) {
    const values = Array.isArray(selected) ? selected : [selected].filter(Boolean);
    return `<div class="wizard-chip-group">${options.map(option => `
        <button class="wizard-chip ${values.includes(option) ? 'selected' : ''}" type="button" data-wizard-select="${key}" data-value="${option}" data-multi="${multi ? 'true' : 'false'}">${option}</button>
    `).join('')}</div>`;
}

function createChoiceBlock(title, options, selected, key) {
    return `
        <span class="wizard-subtitle">${title}</span>
        ${createChipGroup(options, selected, key, false)}
    `;
}

function getTileHelper(option, index) {
    const helpers = {
        'No known allergies': 'Use when none reported',
        'Other': 'Add details',
        'Mixed': 'Flexible pattern',
        'Fast food': 'Frequency check',
        'Sweets': 'Sugar review',
        '6 meals': 'Small frequent meals'
    };
    if (helpers[option]) return helpers[option];
    return ['Common pattern', 'Plan input', 'Preference', 'Review item'][index % 4];
}

function createWizardReviewSummary() {
    const data = state.contextWizardData || {};
    const item = (title, value) => `
        <div class="wizard-summary-card">
            <span>${title}</span>
            <strong>${Array.isArray(value) ? (value.join(', ') || 'Not specified') : (value || 'Not specified')}</strong>
        </div>
    `;
    return `
        <div class="wizard-review-grid">
            ${item('Allergies', [...(data.allergies || []), data.allergyOther].filter(Boolean))}
            ${item('Diet type', data.dietType === 'Other' ? data.dietOther : data.dietType)}
            ${item('Foods liked', [...(data.likedFoods || []), data.likedOther].filter(Boolean))}
            ${item('Foods avoided', [...(data.avoidedFoods || []), data.avoidedNotes].filter(Boolean))}
            ${item('Routine', `${data.activityLevel || 'Not specified'} · ${data.workType || ''} · Wake ${data.wakeTime || '--'}`)}
            ${item('Meals per day', `${data.mealsPerDay || 'Not specified'} · ${data.snackPreference || 'No snack preference'}`)}
            ${item('Water intake', `${data.waterIntake || 'Not specified'} · Reminders: ${data.hydrationReminder || 'No'}`)}
            ${item('Clinical focus', data.clinicalGoals || [])}
        </div>
        <label class="wizard-field">
            <span>Final doctor instructions</span>
            <textarea data-wizard-field="doctorInstructions" placeholder="Confirm or refine instructions before generation">${data.doctorInstructions || ''}</textarea>
        </label>
    `;
}

function bindContextReviewEvents() {
    document.getElementById('contextReviewCancel')?.addEventListener('click', () => {
        if (state.contextWizardStep > 0) navigateContextWizard(-1);
        else closeContextReviewModal();
    });
    document.getElementById('ctxSkipBtn')?.addEventListener('click', () => navigateContextWizard(1));
    document.getElementById('ctxNextBtn')?.addEventListener('click', () => navigateContextWizard(1));
    document.getElementById('ctxSaveDraftBtn')?.addEventListener('click', savePatientContextDraft);
    document.getElementById('ctxApproveBtn')?.addEventListener('click', approvePatientContext);
    document.querySelectorAll('[data-wizard-select]').forEach(control => {
        control.addEventListener('click', () => toggleWizardSelection(control));
    });
    document.querySelectorAll('[data-wizard-field]').forEach(field => {
        field.addEventListener('input', () => {
            state.contextWizardData[field.dataset.wizardField] = field.value;
        });
        field.addEventListener('change', () => {
            state.contextWizardData[field.dataset.wizardField] = field.value;
        });
    });
}

function toggleWizardSelection(control) {
    const key = control.dataset.wizardSelect;
    const value = control.dataset.value;
    const isMulti = control.dataset.multi === 'true';
    if (!key || !state.contextWizardData) return;
    if (isMulti) {
        const current = Array.isArray(state.contextWizardData[key]) ? [...state.contextWizardData[key]] : [];
        const hasValue = current.includes(value);
        state.contextWizardData[key] = hasValue ? current.filter(item => item !== value) : [...current, value];
        if (key === 'allergies' && value === 'No known allergies' && !hasValue) {
            state.contextWizardData.allergies = ['No known allergies'];
        } else if (key === 'allergies' && value !== 'No known allergies') {
            state.contextWizardData.allergies = state.contextWizardData.allergies.filter(item => item !== 'No known allergies');
        }
    } else {
        state.contextWizardData[key] = value;
    }
    renderContextWizard();
}

function navigateContextWizard(direction) {
    persistVisibleWizardFields();
    const next = Math.max(0, Math.min(CONTEXT_WIZARD_STEPS.length - 1, state.contextWizardStep + direction));
    if (next === state.contextWizardStep) return;
    state.contextWizardStep = next;
    renderContextWizard();
}

function persistVisibleWizardFields() {
    document.querySelectorAll('[data-wizard-field]').forEach(field => {
        if (state.contextWizardData) state.contextWizardData[field.dataset.wizardField] = field.value;
    });
}

function savePatientContextDraft() {
    persistVisibleWizardFields();
    syncWizardDataToPatient({ markReviewed: false });
    closeContextReviewModal();
}

function syncWizardDataToPatient({ markReviewed = true } = {}) {
    const record = getActivePatientRecord();
    const data = state.contextWizardData;
    if (!record || !data) return null;
    const allergyList = [...(data.allergies || []).filter(item => item !== 'Other'), data.allergyOther].filter(Boolean);
    const likedList = [...(data.likedFoods || []), data.likedOther].filter(Boolean);
    const avoidedList = [...(data.avoidedFoods || []), data.avoidedNotes].filter(Boolean);
    const restrictionMap = {
        'Diabetes control': 'Diabetic-friendly',
        'Weight loss': 'Weight loss',
        'Weight gain': 'Weight gain',
        'Heart healthy': 'Heart healthy',
        'Low sodium': 'Low sodium',
        'Low sugar': 'Low sugar',
        'Low fat': 'Low fat',
        'High protein': 'High protein',
        'Renal friendly': 'Renal-friendly',
        'Thyroid support': 'Thyroid support',
        'Digestive health': 'Digestive health',
        'PCOS support': 'PCOS support',
        'General wellness': 'General wellness'
    };
    const restrictions = (data.clinicalGoals || []).map(goal => restrictionMap[goal] || goal);
    record.contextDetails = {
        name: data.patient?.name || record.name,
        age: data.patient?.age || String(record.age),
        gender: data.patient?.gender || record.gender,
        height: data.patient?.height || '',
        weight: data.patient?.weight || '',
        bmi: data.patient?.bmi || record.bmi,
        conditions: data.patient?.conditions || '',
        medications: data.patient?.medications || '',
        allergies: allergyList.join(', ') || 'None reported',
        allergyNotes: data.allergyNotes || '',
        foodPreference: data.dietType === 'Other' ? (data.dietOther || 'Other') : data.dietType,
        cuisinePreference: (data.cuisines || [])[0] || 'Mixed',
        eatsRegularly: (data.regularFoods || []).join(', '),
        likes: likedList.join(', '),
        dislikes: avoidedList.join(', '),
        mealsPerDay: String(data.mealsPerDay || '5 meals').replace(' meals', ''),
        routine: [data.routine, data.workType, data.exerciseFrequency, (data.exerciseTypes || []).join(', ')].filter(Boolean).join(' · '),
        activityLevel: data.activityLevel || 'Moderately active',
        mealTimings: `Breakfast ${data.breakfastTime || '--'}, Lunch ${data.lunchTime || '--'}, Dinner ${data.dinnerTime || '--'}, Snack: ${data.snackPreference || 'Both'}`,
        waterIntake: data.waterIntake || '',
        hydrationReminder: data.hydrationReminder || 'No',
        restrictions,
        doctorNotes: data.doctorInstructions || ''
    };
    record.patientPreferenceWizard = JSON.parse(JSON.stringify(data));
    record.contextTags = deriveContextTagsFromDetails(record.contextDetails);
    record.restrictions = restrictions;
    record.clinicalNotes = data.doctorInstructions ? [data.doctorInstructions] : record.clinicalNotes;
    if (markReviewed && record.workflowState !== 'dietPlanReady') {
        record.workflowState = 'contextReviewed';
        record.planStatus = 'Context Reviewed';
    }
    renderRightPatientContext(record);
    return record;
}

function approvePatientContext() {
    persistVisibleWizardFields();
    const record = syncWizardDataToPatient({ markReviewed: true });
    const footer = document.getElementById('ctxReviewFooter');
    if (footer) {
        footer.innerHTML = `
            <div class="ctx-approved-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
                Preferences saved. Generating weekly clinical diet plan...
            </div>`;
    }
    const btn = document.querySelector('.rh-context .rh-review-btn');
    if (btn) { btn.textContent = 'Saved'; btn.classList.add('rh-btn-approved'); }
    setTimeout(() => {
        closeContextReviewModal();
        if (record) generateDietPlan();
    }, 650);
}

function createPatientContextReviewHTML() {
    return '';
}

function approvePatientContextLegacy() {
    const form = document.getElementById('patientContextForm');
    const record = getActivePatientRecord();
    if (form && record) {
        const data = new FormData(form);
        const restrictions = data.getAll('restrictions');
        record.contextDetails = {
            name: data.get('name') || record.name,
            age: data.get('age') || String(record.age),
            gender: data.get('gender') || record.gender,
            height: data.get('height') || '',
            weight: data.get('weight') || '',
            bmi: data.get('bmi') || record.bmi,
            conditions: data.get('conditions') || '',
            medications: data.get('medications') || '',
            allergies: data.get('allergies') || '',
            foodPreference: data.get('foodPreference') || 'Vegetarian',
            cuisinePreference: data.get('cuisinePreference') || 'Mixed',
            eatsRegularly: data.get('eatsRegularly') || '',
            likes: data.get('likes') || '',
            dislikes: data.get('dislikes') || '',
            mealsPerDay: data.get('mealsPerDay') || '5',
            routine: data.get('routine') || '',
            activityLevel: data.get('activityLevel') || 'Moderate',
            mealTimings: data.get('mealTimings') || '',
            waterIntake: data.get('waterIntake') || '',
            restrictions,
            doctorNotes: data.get('doctorNotes') || ''
        };
        record.contextTags = deriveContextTagsFromDetails(record.contextDetails);
        record.restrictions = restrictions;
        record.clinicalNotes = record.contextDetails.doctorNotes
            ? [record.contextDetails.doctorNotes]
            : record.clinicalNotes;
        if (record.workflowState !== 'dietPlanReady') {
            record.workflowState = 'contextReviewed';
            record.planStatus = 'Context Reviewed';
        }
        renderRightPatientContext(record);
    }
    const footer = document.getElementById('ctxReviewFooter');
    if (footer) {
        footer.innerHTML = `
            <div class="ctx-approved-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
                Patient context saved and synced
            </div>`;
    }
    const btn = document.querySelector('.rh-context .rh-review-btn');
    if (btn) { btn.textContent = 'Saved'; btn.classList.add('rh-btn-approved'); }
    setTimeout(() => {
        closeContextReviewModal();
        generateDietPlan();
    }, 650);
}

/* Legacy single-page context form kept only for older saved markup paths. */
function createPatientContextReviewHTMLLegacy(isModal = false) {
    const record = getActivePatientRecord();
    const details = getPatientContextDetails(record);
    const option = (value, selectedValue) => `<option${value === selectedValue ? ' selected' : ''}>${value}</option>`;
    const restrictionOptions = ['Low sodium', 'Low sugar', 'Low fat', 'High protein', 'Renal-friendly', 'Diabetic-friendly', 'Heart healthy'];
    const normalizedRestrictions = new Set((details.restrictions || []).map(item => item.toLowerCase().replace(/\s+/g, ' ').replace('renal friendly', 'renal-friendly').replace('diabetic friendly', 'diabetic-friendly').replace('heart healthy', 'heart healthy')));
    return `
        <form class="ctx-review-panel ctx-form-panel" id="patientContextForm">
            <div class="ctx-form-grid">
                <label class="ctx-form-field">
                    <span>Patient name</span>
                    <input name="name" value="${details.name || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Age</span>
                    <input name="age" value="${details.age || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Gender</span>
                    <input name="gender" value="${details.gender || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Height</span>
                    <input name="height" value="${details.height || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Weight</span>
                    <input name="weight" value="${details.weight || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>BMI</span>
                    <input name="bmi" value="${details.bmi || ''}">
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Medical conditions</span>
                    <input name="conditions" value="${details.conditions || ''}">
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Current medications</span>
                    <input name="medications" value="${details.medications || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Allergies</span>
                    <input name="allergies" value="${details.allergies || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Food preference</span>
                    <select name="foodPreference">
                        ${['Vegetarian', 'Non-vegetarian', 'Vegan', 'Eggetarian', 'Jain', 'Other'].map(v => option(v, details.foodPreference)).join('')}
                    </select>
                </label>
                <label class="ctx-form-field">
                    <span>Cuisine preference</span>
                    <select name="cuisinePreference">
                        ${['Maharashtrian', 'South Indian', 'North Indian', 'Gujarati', 'Bengali', 'Continental', 'Mixed'].map(v => option(v, details.cuisinePreference)).join('')}
                    </select>
                </label>
                <label class="ctx-form-field">
                    <span>Meals per day</span>
                    <select name="mealsPerDay">
                        ${['3', '4', '5', '6'].map(v => option(v, String(details.mealsPerDay).replace(' meals', ''))).join('')}
                    </select>
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Foods the patient eats regularly</span>
                    <input name="eatsRegularly" value="${details.eatsRegularly || ''}">
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Foods patient likes</span>
                    <input name="likes" value="${details.likes || ''}">
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Foods patient dislikes</span>
                    <input name="dislikes" value="${details.dislikes || ''}">
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Daily routine / activity level</span>
                    <textarea name="routine">${details.routine || ''}</textarea>
                </label>
                <label class="ctx-form-field">
                    <span>Activity level</span>
                    <select name="activityLevel">
                        ${['Sedentary', 'Light', 'Moderate', 'Active'].map(v => option(v, details.activityLevel)).join('')}
                    </select>
                </label>
                <label class="ctx-form-field">
                    <span>Preferred meal timings</span>
                    <input name="mealTimings" value="${details.mealTimings || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Water intake</span>
                    <input name="waterIntake" value="${details.waterIntake || ''}">
                </label>
                <div class="ctx-form-field ctx-form-wide">
                    <span>Clinical restrictions</span>
                    <div class="ctx-checkbox-grid">
                        ${restrictionOptions.map(value => {
                            const key = value.toLowerCase();
                            const checked = normalizedRestrictions.has(key) || [...normalizedRestrictions].some(item => item.includes(key.replace('-friendly', '')));
                            return `<label><input type="checkbox" name="restrictions" value="${value}"${checked ? ' checked' : ''}> ${value}</label>`;
                        }).join('')}
                    </div>
                </div>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Doctor notes</span>
                    <textarea name="doctorNotes">${details.doctorNotes || ''}</textarea>
                </label>
            </div>
        </form>
    `;
}

function bindContextReviewEventsLegacy() {
    document.getElementById('patientContextForm')?.addEventListener('submit', (e) => e.preventDefault());
    const approveBtn = document.getElementById('ctxApproveBtn');
    if (approveBtn) approveBtn.addEventListener('click', approvePatientContextLegacy);
}

/*
function createPatientContextReviewHTML(isModal = false) {
    const record = getActivePatientRecord();
    const details = getPatientContextDetails(record);
    const option = (value, selectedValue) => `<option${value === selectedValue ? ' selected' : ''}>${value}</option>`;
    const restrictionOptions = ['Low sodium', 'Low sugar', 'Low fat', 'High protein', 'Renal-friendly', 'Diabetic-friendly', 'Heart healthy'];
    const normalizedRestrictions = new Set((details.restrictions || []).map(item => item.toLowerCase().replace(/\s+/g, ' ').replace('renal friendly', 'renal-friendly').replace('diabetic friendly', 'diabetic-friendly').replace('heart healthy', 'heart healthy')));
    return `
        <form class="ctx-review-panel ctx-form-panel" id="patientContextForm">
            <div class="ctx-form-grid">
                <label class="ctx-form-field">
                    <span>Patient name</span>
                    <input name="name" value="${details.name || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Age</span>
                    <input name="age" value="${details.age || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Gender</span>
                    <input name="gender" value="${details.gender || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Height</span>
                    <input name="height" value="${details.height || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Weight</span>
                    <input name="weight" value="${details.weight || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>BMI</span>
                    <input name="bmi" value="${details.bmi || ''}">
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Medical conditions</span>
                    <input name="conditions" value="${details.conditions || ''}">
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Current medications</span>
                    <input name="medications" value="${details.medications || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Allergies</span>
                    <input name="allergies" value="${details.allergies || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Food preference</span>
                    <select name="foodPreference">
                        ${['Vegetarian', 'Non-vegetarian', 'Vegan', 'Eggetarian', 'Jain', 'Other'].map(v => option(v, details.foodPreference)).join('')}
                    </select>
                </label>
                <label class="ctx-form-field">
                    <span>Cuisine preference</span>
                    <select name="cuisinePreference">
                        ${['Maharashtrian', 'South Indian', 'North Indian', 'Gujarati', 'Bengali', 'Continental', 'Mixed'].map(v => option(v, details.cuisinePreference)).join('')}
                    </select>
                </label>
                <label class="ctx-form-field">
                    <span>Meals per day</span>
                    <select name="mealsPerDay">
                        ${['3', '4', '5', '6'].map(v => option(v, String(details.mealsPerDay).replace(' meals', ''))).join('')}
                    </select>
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Foods the patient eats regularly</span>
                    <input name="eatsRegularly" value="${details.eatsRegularly || ''}">
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Foods patient likes</span>
                    <input name="likes" value="${details.likes || ''}">
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Foods patient dislikes</span>
                    <input name="dislikes" value="${details.dislikes || ''}">
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Daily routine / activity level</span>
                    <textarea name="routine">${details.routine || ''}</textarea>
                </label>
                <label class="ctx-form-field">
                    <span>Activity level</span>
                    <select name="activityLevel">
                        ${['Sedentary', 'Light', 'Moderate', 'Active'].map(v => option(v, details.activityLevel)).join('')}
                    </select>
                </label>
                <label class="ctx-form-field">
                    <span>Preferred meal timings</span>
                    <input name="mealTimings" value="${details.mealTimings || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Water intake</span>
                    <input name="waterIntake" value="${details.waterIntake || ''}">
                </label>
                <div class="ctx-form-field ctx-form-wide">
                    <span>Clinical restrictions</span>
                    <div class="ctx-checkbox-grid">
                        ${restrictionOptions.map(value => {
                            const key = value.toLowerCase();
                            const checked = normalizedRestrictions.has(key) || [...normalizedRestrictions].some(item => item.includes(key.replace('-friendly', '')));
                            return `<label><input type="checkbox" name="restrictions" value="${value}"${checked ? ' checked' : ''}> ${value}</label>`;
                        }).join('')}
                    </div>
                </div>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Doctor notes</span>
                    <textarea name="doctorNotes">${details.doctorNotes || ''}</textarea>
                </label>
            </div>
        </form>
    `;
}

function bindContextReviewEvents() {
    document.getElementById('patientContextForm')?.addEventListener('submit', (e) => e.preventDefault());
    const approveBtn = document.getElementById('ctxApproveBtn');
    if (approveBtn) approveBtn.addEventListener('click', approvePatientContext);
}

function approvePatientContext() {
    const form = document.getElementById('patientContextForm');
    const record = getActivePatientRecord();
    if (form && record) {
        const data = new FormData(form);
        const restrictions = data.getAll('restrictions');
        record.contextDetails = {
            name: data.get('name') || record.name,
            age: data.get('age') || String(record.age),
            gender: data.get('gender') || record.gender,
            height: data.get('height') || '',
            weight: data.get('weight') || '',
            bmi: data.get('bmi') || record.bmi,
            conditions: data.get('conditions') || '',
            medications: data.get('medications') || '',
            allergies: data.get('allergies') || '',
            foodPreference: data.get('foodPreference') || 'Vegetarian',
            cuisinePreference: data.get('cuisinePreference') || 'Mixed',
            eatsRegularly: data.get('eatsRegularly') || '',
            likes: data.get('likes') || '',
            dislikes: data.get('dislikes') || '',
            mealsPerDay: data.get('mealsPerDay') || '5',
            routine: data.get('routine') || '',
            activityLevel: data.get('activityLevel') || 'Moderate',
            mealTimings: data.get('mealTimings') || '',
            waterIntake: data.get('waterIntake') || '',
            restrictions,
            doctorNotes: data.get('doctorNotes') || ''
        };
        record.contextTags = deriveContextTagsFromDetails(record.contextDetails);
        record.restrictions = restrictions;
        record.clinicalNotes = record.contextDetails.doctorNotes
            ? [record.contextDetails.doctorNotes]
            : record.clinicalNotes;
        if (record.workflowState !== 'dietPlanReady') {
            record.workflowState = 'contextReviewed';
            record.planStatus = 'Context Reviewed';
        }
        renderRightPatientContext(record);
    }
    const footer = document.getElementById('ctxReviewFooter');
    if (footer) {
        footer.innerHTML = `
            <div class="ctx-approved-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
                Patient context saved and synced
            </div>`;
    }
    const btn = document.querySelector('.rh-context .rh-review-btn');
    if (btn) { btn.textContent = 'Saved'; btn.classList.add('rh-btn-approved'); }
    setTimeout(() => {
        closeContextReviewModal();
        generateDietPlan();
    }, 650);
}
*/ /*
        </button>
    `;
}

function createPatientContextReviewHTML(isModal = false) {
    const record = getActivePatientRecord();
    const details = getPatientContextDetails(record);
    const option = (value, selectedValue) => `<option${value === selectedValue ? ' selected' : ''}>${value}</option>`;
    const restrictionOptions = ['Low sodium', 'Low sugar', 'Low fat', 'High protein', 'Renal-friendly', 'Diabetic-friendly', 'Heart healthy'];
    const normalizedRestrictions = new Set((details.restrictions || []).map(item => item.toLowerCase().replace(/\s+/g, ' ').replace('renal friendly', 'renal-friendly').replace('diabetic friendly', 'diabetic-friendly').replace('heart healthy', 'heart healthy')));
    return `
        <form class="ctx-review-panel ctx-form-panel" id="patientContextForm">
            <div class="ctx-form-grid">
                <label class="ctx-form-field">
                    <span>Patient name</span>
                    <input name="name" value="${details.name || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Age</span>
                    <input name="age" value="${details.age || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Gender</span>
                    <input name="gender" value="${details.gender || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Height</span>
                    <input name="height" value="${details.height || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Weight</span>
                    <input name="weight" value="${details.weight || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>BMI</span>
                    <input name="bmi" value="${details.bmi || ''}">
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Medical conditions</span>
                    <input name="conditions" value="${details.conditions || ''}">
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Current medications</span>
                    <input name="medications" value="${details.medications || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Allergies</span>
                    <input name="allergies" value="${details.allergies || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Food preference</span>
                    <select name="foodPreference">
                        ${['Vegetarian', 'Non-vegetarian', 'Vegan', 'Eggetarian', 'Jain', 'Other'].map(v => option(v, details.foodPreference)).join('')}
                    </select>
                </label>
                <label class="ctx-form-field">
                    <span>Cuisine preference</span>
                    <select name="cuisinePreference">
                        ${['Maharashtrian', 'South Indian', 'North Indian', 'Gujarati', 'Bengali', 'Continental', 'Mixed'].map(v => option(v, details.cuisinePreference)).join('')}
                    </select>
                </label>
                <label class="ctx-form-field">
                    <span>Meals per day</span>
                    <select name="mealsPerDay">
                        ${['3', '4', '5', '6'].map(v => option(v, String(details.mealsPerDay).replace(' meals', ''))).join('')}
                    </select>
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Foods the patient eats regularly</span>
                    <input name="eatsRegularly" value="${details.eatsRegularly || ''}">
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Foods patient likes</span>
                    <input name="likes" value="${details.likes || ''}">
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Foods patient dislikes</span>
                    <input name="dislikes" value="${details.dislikes || ''}">
                </label>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Daily routine / activity level</span>
                    <textarea name="routine">${details.routine || ''}</textarea>
                </label>
                <label class="ctx-form-field">
                    <span>Activity level</span>
                    <select name="activityLevel">
                        ${['Sedentary', 'Light', 'Moderate', 'Active'].map(v => option(v, details.activityLevel)).join('')}
                    </select>
                </label>
                <label class="ctx-form-field">
                    <span>Preferred meal timings</span>
                    <input name="mealTimings" value="${details.mealTimings || ''}">
                </label>
                <label class="ctx-form-field">
                    <span>Water intake</span>
                    <input name="waterIntake" value="${details.waterIntake || ''}">
                </label>
                <div class="ctx-form-field ctx-form-wide">
                    <span>Clinical restrictions</span>
                    <div class="ctx-checkbox-grid">
                        ${restrictionOptions.map(value => {
                            const key = value.toLowerCase();
                            const checked = normalizedRestrictions.has(key) || [...normalizedRestrictions].some(item => item.includes(key.replace('-friendly', '')));
                            return `<label><input type="checkbox" name="restrictions" value="${value}"${checked ? ' checked' : ''}> ${value}</label>`;
                        }).join('')}
                    </div>
                </div>
                <label class="ctx-form-field ctx-form-wide">
                    <span>Doctor notes</span>
                    <textarea name="doctorNotes">${details.doctorNotes || ''}</textarea>
                </label>
            </div>
        </form>
    `;
}

function bindContextReviewEvents() {
    document.getElementById('patientContextForm')?.addEventListener('submit', (e) => e.preventDefault());
    const approveBtn = document.getElementById('ctxApproveBtn');
    if (approveBtn) approveBtn.addEventListener('click', approvePatientContext);
}

function approvePatientContext() {
    const form = document.getElementById('patientContextForm');
    const record = getActivePatientRecord();
    if (form && record) {
        const data = new FormData(form);
        const restrictions = data.getAll('restrictions');
        record.contextDetails = {
            name: data.get('name') || record.name,
            age: data.get('age') || String(record.age),
            gender: data.get('gender') || record.gender,
            height: data.get('height') || '',
            weight: data.get('weight') || '',
            bmi: data.get('bmi') || record.bmi,
            conditions: data.get('conditions') || '',
            medications: data.get('medications') || '',
            allergies: data.get('allergies') || '',
            foodPreference: data.get('foodPreference') || 'Vegetarian',
            cuisinePreference: data.get('cuisinePreference') || 'Mixed',
            eatsRegularly: data.get('eatsRegularly') || '',
            likes: data.get('likes') || '',
            dislikes: data.get('dislikes') || '',
            mealsPerDay: data.get('mealsPerDay') || '5',
            routine: data.get('routine') || '',
            activityLevel: data.get('activityLevel') || 'Moderate',
            mealTimings: data.get('mealTimings') || '',
            waterIntake: data.get('waterIntake') || '',
            restrictions,
            doctorNotes: data.get('doctorNotes') || ''
        };
        record.contextTags = deriveContextTagsFromDetails(record.contextDetails);
        record.restrictions = restrictions;
        record.clinicalNotes = record.contextDetails.doctorNotes
            ? [record.contextDetails.doctorNotes]
            : record.clinicalNotes;
        if (record.workflowState !== 'dietPlanReady') {
            record.workflowState = 'contextReviewed';
            record.planStatus = 'Context Reviewed';
        }
        renderRightPatientContext(record);
    }
    const footer = document.getElementById('ctxReviewFooter');
    if (footer) {
        footer.innerHTML = `
            <div class="ctx-approved-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
                Patient context saved and synced
            </div>`;
    }
    const btn = document.querySelector('.rh-context .rh-review-btn');
    if (btn) { btn.textContent = 'Saved'; btn.classList.add('rh-btn-approved'); }
    setTimeout(() => {
        closeContextReviewModal();
        generateDietPlan();
    }, 650);
}

*/
// ============================================
// RIGHT PANEL — BIOMARKER CTA
// ============================================
function addBiomarkerCTAToPanel() {
    if (document.getElementById('panelBiomarkerCTA')) return;
    const vitalsGrid = document.getElementById('vitalsGrid');
    if (!vitalsGrid) return;
    const abnormal = Object.values(getPatientBiomarkerData()).reduce((s, g) => {
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
            Review Patient Biomarkers
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
        iconBg: '#FFF8D8',
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
        iconBg: '#FFF8D8',
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
        iconBg: '#EAF4FA',
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
        iconBg: '#EAF8F6',
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
        iconBg: '#F2F8FB',
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
        iconBg: '#EAF4FA',
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
        iconBg: '#F3FAFC',
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
    const record = getActivePatientRecord();
    return `
        <div class="plan-ready-notification">
            <div class="prn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
            </div>
            <div class="prn-text">
                <span class="prn-title">Diet plan generated for ${record ? record.name : 'Rajesh Sharma'}</span>
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

const WEEKLY_CLINICAL_PLAN = [
    { day: 'Monday', short: 'Mon', kcal: '1,720', meals: '7 meal sections', focus: ['Low GI', 'Low Sodium', 'Diabetes Friendly'] },
    { day: 'Tuesday', short: 'Tue', kcal: '1,690', meals: '7 meal sections', focus: ['High Fiber', 'Heart Healthy', 'Low Sodium'] },
    { day: 'Wednesday', short: 'Wed', kcal: '1,710', meals: '7 meal sections', focus: ['Low GI', 'High Fiber', 'Diabetes Friendly'] },
    { day: 'Thursday', short: 'Thu', kcal: '1,675', meals: '7 meal sections', focus: ['Heart Healthy', 'Low Sodium', 'High Fiber'] },
    { day: 'Friday', short: 'Fri', kcal: '1,705', meals: '7 meal sections', focus: ['Low GI', 'Diabetes Friendly', 'Heart Healthy'] },
    { day: 'Saturday', short: 'Sat', kcal: '1,740', meals: '7 meal sections', focus: ['High Fiber', 'Low Sodium', 'Heart Healthy'] },
    { day: 'Sunday', short: 'Sun', kcal: '1,680', meals: '7 meal sections', focus: ['Low GI', 'Low Sodium', 'Diabetes Friendly'] }
];

function buildWeeklyClinicalPlanHTML() {
    const selectedDay = WEEKLY_CLINICAL_PLAN[0];
    return `
        <section class="dp-weekly-plan" aria-label="Weekly Clinical Diet Plan">
            <div class="dp-weekly-heading">
                <div>
                    <span class="dp-weekly-kicker">Day-wise Nutrition Plan</span>
                    <h3>Weekly Clinical Diet Plan</h3>
                    <p>Review meals across the week before approval</p>
                </div>
                <span class="dp-weekly-review-tag">Doctor Review</span>
            </div>
            <div class="dp-weekday-tabs" role="tablist" aria-label="Weekly clinical meal days">
                ${WEEKLY_CLINICAL_PLAN.map((item, index) => `
                    <button class="dp-weekday-tab${index === 0 ? ' active' : ''}" type="button" role="tab" aria-selected="${index === 0}" data-day="${item.day}">
                        <span>${item.short}</span>
                        <strong>${item.day}</strong>
                    </button>
                `).join('')}
            </div>
            <div class="dp-selected-day-card" id="dpSelectedDayCard">
                <div class="dp-selected-day-overview">
                    <span class="dp-selected-label">Selected review day</span>
                    <strong id="dpSelectedDayName">${selectedDay.day}</strong>
                </div>
                <div class="dp-selected-day-metrics">
                    <span><strong id="dpSelectedDayKcal">${selectedDay.kcal}</strong><small>kcal</small></span>
                    <span><strong id="dpSelectedDayMeals">${selectedDay.meals}</strong><small>Clinical schedule</small></span>
                </div>
                <div class="dp-selected-focus" id="dpSelectedDayFocus">
                    ${selectedDay.focus.map(tag => `<span>${tag}</span>`).join('')}
                </div>
            </div>
        </section>
    `;
}

function renderDietPlanDrawer(drawer) {
    const record = getActivePatientRecord();
    const now = new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    const approveLabel = state.planApproved ? 'Approved by Doctor' : 'Approve Plan';
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
                    <h2 class="dp-main-title">AI Generated Clinical Diet Plan</h2>
                    <div class="dp-patient-info">
                        <span class="dp-patient-name">${record ? record.name : 'Rajesh Sharma'}</span>
                        <span class="dp-patient-meta">${record ? `${record.gender} · ${record.age} yrs · BMI ${record.bmi}` : 'Male · 52 yrs · BMI 28.4'}</span>
                    </div>
                </div>
                <button class="dp-close-btn" id="dpDrawerClose">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="dp-tags-row">
                <span class="dp-risk-tag dp-risk-${record && record.riskClass === 'critical' ? 'critical' : 'diabetes'}">${record ? record.risk : 'High Risk'}</span>
                ${(record ? record.contextTags : ['Diabetic', 'Vegetarian', 'Sugar Control', 'Low Sodium', 'Hypertension']).map(tag => `<span class="dp-ctx-chip">${tag}</span>`).join('')}
            </div>
            <div class="dp-header-meta">
                <span class="dp-timestamp">Review Before Approval · Generated ${now}</span>
            </div>
            <div class="dp-header-actions">
                <button class="dp-action-btn dp-btn-regen" id="dpRegenBtn">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    Modify Recommendation
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
            ${buildNutritionSummaryHTML()}
            ${buildWeeklyClinicalPlanHTML()}
            <div class="dp-meal-schedule-heading">
                <div>
                    <span class="dp-weekly-kicker">Clinical Meal Schedule</span>
                    <h3><span id="dpSelectedScheduleDay">Monday</span> Recommendations</h3>
                </div>
                <span class="dp-meal-schedule-note">Doctor editable sections</span>
            </div>
            ${buildAccordionHTML()}
        </div>
    `;
}

function getDietPlanSections() {
    return [
        {
            id: 'early-morning',
            title: 'Early Morning',
            time: '6:30 - 7:00 AM',
            icon: 'EM',
            iconBg: '#EAF8F6',
            imageClass: 'dp-thumb-hydration',
            kcal: 95,
            macros: { protein: 2, carbs: 14, fat: 2, fiber: 3 },
            items: [
                { text: 'Warm water with soaked methi seeds', kcal: 20 },
                { text: '4 soaked almonds + 1 walnut half', kcal: 75 }
            ],
            rationale: ['Hydration', 'Sugar Control', 'Heart Healthy']
        },
        {
            id: 'breakfast',
            title: 'Breakfast',
            time: '7:30 - 8:30 AM',
            icon: 'AM',
            iconBg: '#FFF8D8',
            imageClass: 'dp-thumb-breakfast',
            kcal: 420,
            macros: { protein: 28, carbs: 42, fat: 12, fiber: 8 },
            items: [
                { text: 'Moong dal chilla (2 pcs) with mint chutney', kcal: 220 },
                { text: '1 bowl vegetable upma (low oil, with oats)', kcal: 195 },
                { text: 'Green tea or black coffee (no sugar)', kcal: 5 }
            ],
            rationale: ['High Protein', 'Low GI', 'Diabetes Friendly', 'Fiber Rich']
        },
        {
            id: 'mid-morning',
            title: 'Mid Morning',
            time: '10:30 - 11:00 AM',
            icon: 'MM',
            iconBg: '#EAF4FA',
            imageClass: 'dp-thumb-snack',
            kcal: 145,
            macros: { protein: 6, carbs: 18, fat: 4, fiber: 3 },
            items: [
                { text: '1 small apple or guava (low GI fruit)', kcal: 65 },
                { text: 'Handful of roasted chana (20g)', kcal: 80 }
            ],
            rationale: ['Low GI Fruit', 'Protein Snack', 'Sustained Energy']
        },
        {
            id: 'lunch',
            title: 'Lunch',
            time: '1:00 - 1:30 PM',
            icon: 'LN',
            iconBg: '#EAF8F6',
            imageClass: 'dp-thumb-lunch',
            kcal: 505,
            macros: { protein: 24, carbs: 62, fat: 14, fiber: 10 },
            items: [
                { text: '1 small jowar/bajra roti + 1 multigrain roti', kcal: 150 },
                { text: '1 bowl dal (masoor/moong) - low salt', kcal: 120 },
                { text: 'Lauki/tinda sabzi (low oil preparation)', kcal: 70 },
                { text: 'Cucumber and tomato salad with lemon dressing', kcal: 35 },
                { text: '1 small bowl curd (low fat)', kcal: 80 }
            ],
            rationale: ['Reduced Sodium', 'Low GI Grains', 'High Fiber', 'Diabetes Friendly']
        },
        {
            id: 'evening-snack',
            title: 'Evening Snack',
            time: '4:30 - 5:00 PM',
            icon: 'ES',
            iconBg: '#F2F8FB',
            imageClass: 'dp-thumb-snack',
            kcal: 175,
            macros: { protein: 7, carbs: 20, fat: 5, fiber: 4 },
            items: [
                { text: 'Green tea (unsweetened)', kcal: 0 },
                { text: '1 multigrain khakhra or 2 flax crackers', kcal: 110 },
                { text: 'Sprout salad with lemon (small bowl)', kcal: 65 }
            ],
            rationale: ['Antioxidant', 'Low Carb', 'Metabolism Support']
        },
        {
            id: 'dinner',
            title: 'Dinner',
            time: '7:30 - 8:00 PM',
            icon: 'DN',
            iconBg: '#EAF4FA',
            imageClass: 'dp-thumb-dinner',
            kcal: 385,
            macros: { protein: 24, carbs: 34, fat: 15, fiber: 7 },
            items: [
                { text: '1 multigrain roti (small)', kcal: 80 },
                { text: 'Palak/methi sabzi (low oil, no cream)', kcal: 90 },
                { text: '1 bowl mix veg soup (clear, no corn starch)', kcal: 60 },
                { text: 'Small portion grilled paneer (50g)', kcal: 130 }
            ],
            rationale: ['Light Carb', 'Iron Rich', 'Heart Healthy', 'Low Calorie']
        },
        {
            id: 'bedtime',
            title: 'Bedtime',
            time: '9:30 - 10:00 PM',
            icon: 'BT',
            iconBg: '#F3FAFC',
            imageClass: 'dp-thumb-hydration',
            kcal: 90,
            macros: { protein: 4, carbs: 10, fat: 3, fiber: 2 },
            items: [
                { text: '1 glass warm turmeric milk (low fat, no sugar)', kcal: 80 },
                { text: 'Isabgol 1 tsp in water (if needed for fiber)', kcal: 10 }
            ],
            rationale: ['Anti-inflammatory', 'Calcium', 'Digestive Health']
        }
    ];
}

// ============================================
// NUTRITION SUMMARY (Review Plan modal only)
// ============================================
function buildNutritionSummaryHTML() {
    const sections = getDietPlanSections();
    let totalKcal = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0;
    sections.forEach(function(s) {
        totalKcal    += (s.kcal || 0);
        if (s.macros) {
            totalProtein += (s.macros.protein || 0);
            totalCarbs   += (s.macros.carbs   || 0);
            totalFat     += (s.macros.fat     || 0);
            totalFiber   += (s.macros.fiber   || 0);
        }
    });
    return `
        <div class="dp-nutrition-summary">
            <span class="dp-nutr-label-row">Clinical Nutrition Summary</span>
            <div class="dp-nutr-chips">
                <div class="dp-nutr-chip dp-nutr-kcal">
                    <span class="dp-nutr-val">${totalKcal}</span>
                    <span class="dp-nutr-unit">kcal</span>
                </div>
                <div class="dp-nutr-chip">
                    <span class="dp-nutr-val">${totalProtein}g</span>
                    <span class="dp-nutr-unit">Protein</span>
                </div>
                <div class="dp-nutr-chip">
                    <span class="dp-nutr-val">${totalCarbs}g</span>
                    <span class="dp-nutr-unit">Carbs</span>
                </div>
                <div class="dp-nutr-chip">
                    <span class="dp-nutr-val">${totalFat}g</span>
                    <span class="dp-nutr-unit">Fat</span>
                </div>
                <div class="dp-nutr-chip">
                    <span class="dp-nutr-val">${totalFiber}g</span>
                    <span class="dp-nutr-unit">Fiber</span>
                </div>
            </div>
        </div>
    `;
}

function renderDietPlanLoading(drawer) {
    const record = getActivePatientRecord();
    drawer.innerHTML = `
        <div class="dp-drawer-header dp-loading-header">
            <div class="dp-header-top">
                <div class="dp-title-block">
                    <div class="dp-badge-row">
                        <span class="dp-ai-badge">AI Generated</span>
                        <span class="dp-edit-badge">Doctor Editable</span>
                    </div>
                    <h2 class="dp-main-title">AI Generated Clinical Diet Plan</h2>
                    <div class="dp-patient-info">
                        <span class="dp-patient-name">${record ? record.name : 'Rajesh Sharma'}</span>
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
                <div class="dp-ai-thinking" aria-hidden="true"><span></span><span></span><span></span></div>
                <div class="dp-generation-title">Preparing clinical diet recommendation...</div>
                <div class="dp-generation-steps">
                    <div class="dp-gen-step active"><span></span>Analyzing biomarkers</div>
                    <div class="dp-gen-step active"><span></span>Checking patient context</div>
                    <div class="dp-gen-step active"><span></span>Creating meal plan</div>
                    <div class="dp-gen-step active"><span></span>Ready for doctor review</div>
                </div>
            </div>
            <div class="dp-skeleton-acc">
                ${Array.from({ length: 7 }).map((_, index) => `
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
    const substituteSVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>`;
    const addSVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>`;

    const itemsHTML = meal.items.map(item => {
        const itemText = (item && typeof item === 'object') ? (item.text || '') : String(item || '');
        const itemKcal = (item && typeof item === 'object' && item.kcal != null && item.kcal > 0) ? item.kcal : null;
        return `
        <li class="dp-meal-li">
            <span class="dp-item-dot"></span>
            <span class="dp-item-text">${itemText}</span>
            ${itemKcal !== null ? `<span class="dp-item-kcal">${itemKcal} kcal</span>` : ''}
            <div class="dp-item-btns">
                <button class="dp-item-btn dp-edit-btn" title="Edit item">${editSVG}</button>
                <button class="dp-item-btn dp-del-btn" title="Remove item">${delSVG}</button>
            </div>
        </li>
    `;
    }).join('');

    const rationaleHTML = meal.rationale.map(tag => `
        <span class="dp-rat-tag">${checkSVG} ${tag}</span>
    `).join('');

    return `
        <div class="dp-acc-item ${expanded ? 'dp-acc-expanded' : ''}" data-meal-id="${meal.id}">
            <div class="dp-acc-header">
                <div class="dp-meal-thumb ${meal.imageClass || 'dp-thumb-breakfast'}" aria-hidden="true"><span>${meal.icon}</span></div>
                <div class="dp-acc-info">
                    <div class="dp-acc-title-row">
                        <span class="dp-acc-title">${meal.title}</span>
                        ${meal.kcal ? `<span class="dp-acc-kcal">&bull; ${meal.kcal} kcal</span>` : ''}
                    </div>
                    <span class="dp-acc-time">${meal.time}</span>
                </div>
                <div class="dp-acc-right">
                    <span class="dp-acc-count">${meal.items.length} item${meal.items.length !== 1 ? 's' : ''}</span>
                    <button class="dp-meal-mini-btn dp-meal-edit-btn" title="Edit meal">${editSVG}</button>
                    <button class="dp-meal-mini-btn dp-meal-sub-btn" title="Substitute meal">${substituteSVG}</button>
                    <svg class="dp-acc-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 12,15 18,9"/></svg>
                </div>
            </div>
            <div class="dp-acc-body">
                <ul class="dp-meal-items" id="dp-items-${meal.id}">
                    ${itemsHTML}
                </ul>
                <div class="dp-acc-actions">
                    <button class="dp-add-item-btn" data-meal="${meal.id}">${addSVG} Add Clinical Option</button>
                    <button class="dp-regen-section-btn" data-meal="${meal.id}">${regenSVG} Regenerate Section</button>
                </div>
                ${meal.macros ? `
                <div class="dp-meal-macros">
                    <span>${meal.macros.protein}g Protein</span>
                    <span class="dp-macro-dot">&bull;</span>
                    <span>${meal.macros.carbs}g Carbs</span>
                    <span class="dp-macro-dot">&bull;</span>
                    <span>${meal.macros.fat}g Fat</span>
                    <span class="dp-macro-dot">&bull;</span>
                    <span>${meal.macros.fiber}g Fiber</span>
                </div>` : ''}
                <div class="dp-rationale">
                    <span class="dp-rat-label">Clinical Rationale:</span>
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

        // Weekly navigator is presentation-only; it labels the currently reviewed day.
        document.querySelectorAll('#dpDrawer .dp-weekday-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const selectedDay = WEEKLY_CLINICAL_PLAN.find(item => item.day === tab.dataset.day);
                if (!selectedDay) return;
                document.querySelectorAll('#dpDrawer .dp-weekday-tab').forEach(dayTab => {
                    const active = dayTab === tab;
                    dayTab.classList.toggle('active', active);
                    dayTab.setAttribute('aria-selected', String(active));
                });
                document.getElementById('dpSelectedDayName').textContent = selectedDay.day;
                document.getElementById('dpSelectedDayKcal').textContent = selectedDay.kcal;
                document.getElementById('dpSelectedDayMeals').textContent = selectedDay.meals;
                document.getElementById('dpSelectedScheduleDay').textContent = selectedDay.day;
                document.getElementById('dpSelectedDayFocus').innerHTML = selectedDay.focus.map(tag => `<span>${tag}</span>`).join('');
            });
        });

        // Accordion header toggle
        document.querySelectorAll('.dp-acc-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                const item = header.closest('.dp-acc-item');
                if (item) item.classList.toggle('dp-acc-expanded');
            });
        });

        document.querySelectorAll('.dp-meal-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                btn.closest('.dp-acc-item')?.classList.add('dp-acc-expanded');
            });
        });

        document.querySelectorAll('.dp-meal-sub-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const acc = btn.closest('.dp-acc-item');
                const list = acc?.querySelector('.dp-meal-items');
                if (!list) return;
                btn.classList.add('dp-btn-active');
                setTimeout(() => btn.classList.remove('dp-btn-active'), 650);
                list.insertAdjacentHTML('beforeend', `
                    <li class="dp-meal-li dp-item-new">
                        <span class="dp-item-dot"></span>
                        <span class="dp-item-text">AI substitute option: seasonal low-GI bowl, doctor editable</span>
                        <span class="dp-item-kcal">120 kcal</span>
                    </li>
                `);
                acc.classList.add('dp-acc-expanded');
                updateAccordionCount(acc);
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
    const activeRecord = getActivePatientRecord();
    if (activeRecord) {
        activeRecord.planApproved = true;
        activeRecord.planStatus = 'Approved by Doctor';
        renderRightPatientContext(activeRecord);
    }
    btn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20,6 9,17 4,12"/></svg>
        Approved by Doctor
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
        <span>Nutrition prescription approved by Dr. Sharma · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
// SIDEBAR TOOLTIPS (position:fixed, escapes overflow)
// ============================================
function initSidebarTooltips() {
    if (!els.sidebar) return;
    const tooltip = document.createElement('div');
    tooltip.className = 'sidebar-tooltip';
    tooltip.id = 'sidebarTooltip';
    document.body.appendChild(tooltip);

    let hideTimer = null;

    els.sidebar.addEventListener('mouseover', (e) => {
        if (!els.sidebar.classList.contains('collapsed')) return;
        const target = e.target.closest('[data-tooltip]');
        if (!target) return;

        clearTimeout(hideTimer);
        const text = target.dataset.tooltip;
        if (!text) return;

        const rect = target.getBoundingClientRect();
        tooltip.textContent = text;
        tooltip.style.left = (rect.right + 10) + 'px';
        tooltip.style.top  = (rect.top + rect.height / 2) + 'px';
        tooltip.classList.add('visible');
    });

    els.sidebar.addEventListener('mouseout', (e) => {
        const leaving = e.target.closest('[data-tooltip]');
        if (!leaving) return;
        hideTimer = setTimeout(() => tooltip.classList.remove('visible'), 80);
    });

    // Also hide when sidebar is expanded
    els.sidebar.addEventListener('transitionend', () => {
        tooltip.classList.remove('visible');
    });
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', init);
