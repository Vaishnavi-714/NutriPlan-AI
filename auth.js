/* ============================================
   NUTRI COPILOT — AUTH LOGIC
   Login / Signup flow with transitions
   ============================================ */

// ============================================
// PASSWORD STRENGTH INDICATOR
// ============================================
const signupPassword = document.getElementById('signupPassword');
if (signupPassword) {
    signupPassword.addEventListener('input', (e) => {
        const val = e.target.value;
        const bars = [
            document.getElementById('str1'),
            document.getElementById('str2'),
            document.getElementById('str3'),
            document.getElementById('str4')
        ];
        const strengthText = document.getElementById('strengthText');

        let score = 0;
        if (val.length >= 6) score++;
        if (val.length >= 10) score++;
        if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
        if (/[0-9]/.test(val) && /[^A-Za-z0-9]/.test(val)) score++;

        const levels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
        const classes = ['', 'weak', 'medium', 'medium', 'strong'];

        bars.forEach((bar, i) => {
            bar.classList.remove('active', 'weak', 'medium', 'strong');
            if (i < score) {
                bar.classList.add('active', classes[score]);
            }
        });

        if (strengthText) {
            strengthText.textContent = val.length > 0 ? levels[score] || '' : '';
            strengthText.style.color =
                score <= 1 ? 'var(--error)' :
                score <= 3 ? 'var(--warning)' :
                'var(--success)';
        }
    });
}

// ============================================
// LOGIN FORM
// ============================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    const loginBtn = document.getElementById('loginBtn');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginBtn.textContent = 'Logging in...';
        loginBtn.style.opacity = '0.7';
        loginBtn.disabled = true;

        // Simulate auth delay then transition to dashboard
        setTimeout(() => {
            navigateTo('index.html');
        }, 1200);
    });

    loginBtn.addEventListener('click', () => {
        loginForm.dispatchEvent(new Event('submit'));
    });
}

// ============================================
// SIGNUP FORM
// ============================================
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    const signupBtn = document.getElementById('signupBtn');

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        signupBtn.textContent = 'Creating account...';
        signupBtn.style.opacity = '0.7';
        signupBtn.disabled = true;

        // Simulate account creation then transition to dashboard
        setTimeout(() => {
            navigateTo('index.html');
        }, 1500);
    });

    signupBtn.addEventListener('click', () => {
        signupForm.dispatchEvent(new Event('submit'));
    });
}

// ============================================
// SOCIAL AUTH BUTTONS
// ============================================
document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.style.opacity = '0.6';
        btn.style.pointerEvents = 'none';
        setTimeout(() => {
            navigateTo('index.html');
        }, 1000);
    });
});

// ============================================
// FORM INPUT ANIMATIONS
// ============================================
document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('focus', () => {
        input.parentElement.style.transform = 'translateY(-1px)';
        input.parentElement.style.transition = 'transform 0.2s ease';
    });
    input.addEventListener('blur', () => {
        input.parentElement.style.transform = 'translateY(0)';
    });
});

// navigateTo function is provided by landing.js (loaded first)
