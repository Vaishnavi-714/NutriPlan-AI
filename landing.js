/* ============================================
   NUTRI COPILOT — LANDING PAGE LOGIC
   ============================================ */

// ============================================
// NAV SCROLL EFFECT
// ============================================
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
});

// ============================================
// MOBILE NAV
// ============================================
const mobileToggle = document.getElementById('mobileNavToggle');
const mobileDrawer = document.getElementById('mobileNavDrawer');

if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
        mobileDrawer.classList.toggle('hidden');
    });

    mobileDrawer.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            mobileDrawer.classList.add('hidden');
        });
    });
}

// ============================================
// SCROLL REVEAL
// ============================================
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, i * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => observer.observe(el));
}

// ============================================
// PAGE TRANSITIONS
// ============================================
function navigateTo(url) {
    const overlay = document.getElementById('pageTransition');
    if (overlay) {
        overlay.classList.remove('done');
        overlay.classList.add('active');
        setTimeout(() => {
            window.location.href = url;
        }, 500);
    } else {
        window.location.href = url;
    }
}

// Intercept navigation links for smooth transitions
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Only intercept local page links (not anchors)
    if (href.endsWith('.html') && !href.startsWith('http')) {
        e.preventDefault();
        navigateTo(href);
    }
});

// On page load, fade the page in smoothly
window.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('pageTransition');
    if (overlay) {
        // Overlay starts at opacity:1 (via 'entering' class set in HTML)
        // Double rAF ensures the browser has painted before we trigger the transition
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.classList.add('done');
            });
        });
    }
});

// ============================================
// WATCH DEMO BUTTON
// ============================================
const watchDemoBtn = document.getElementById('watchDemoBtn');
if (watchDemoBtn) {
    watchDemoBtn.addEventListener('click', () => {
        const demo = document.getElementById('ai-experience');
        if (demo) {
            demo.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', initScrollReveal);
