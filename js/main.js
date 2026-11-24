/* ================================================
   MAIN.JS — ChatSphere
   Common JavaScript: runs on EVERY page

   WHAT THIS FILE DOES:
   - Age gate modal (18+ verification, stored in localStorage)
   - "Site is Safe" banner (shows after page load)
   - Mobile navigation toggle (hamburger menu)
   - Dropdown menus
   - Scroll reveal animations
   - Active nav link highlighting
   - Toast notification helper function
   - Navbar scroll effect (adds shadow on scroll)
   ================================================ */

// ================================================
// CONFIGURATION — Change site-wide settings here
// ================================================
const CONFIG = {
  siteName: 'ChatSphere',          // Site name shown in notifications
  ageGateKey: 'cs_age_verified',   // localStorage key for age verification
  safeBannerDelay: 1500,           // ms before safe banner shows
  notifPromptDelay: 8000,          // ms before notification prompt shows
};

// ================================================
// RUN ON PAGE LOAD
// Everything starts here
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  initAgeGate();         // 1. Show 18+ modal if not verified
  initNavbar();          // 2. Mobile nav, dropdowns, scroll effects
  initSafeBanner();      // 3. "This site is safe" top banner
  initScrollReveal();    // 4. Animate elements as they scroll into view
  highlightActiveNav();  // 5. Mark current page in nav as active
});

// ================================================
// 1. AGE GATE MODAL
// Shows a 18+ verification modal on first visit
// Remembers user's choice using localStorage
// ================================================
function initAgeGate() {
  const overlay = document.getElementById('age-gate-overlay');
  if (!overlay) return; // Skip if no modal on page

  // Check if user already verified age (stored in localStorage)
  const isVerified = localStorage.getItem(CONFIG.ageGateKey);

  if (!isVerified) {
    // Show modal — prevent background scroll
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  } else {
    // Already verified — remove modal
    overlay.remove();
  }

  // "I'm 18 or older" button
  const enterBtn = document.getElementById('age-gate-enter');
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      // Save to localStorage so it doesn't show again
      localStorage.setItem(CONFIG.ageGateKey, 'true');
      overlay.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = '';
      }, 300);
    });
  }

  // "I'm under 18" button — redirect away
  const exitBtn = document.getElementById('age-gate-exit');
  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      window.location.href = 'https://www.google.com'; // Redirect underage users
    });
  }
}

// ================================================
// 2. NAVBAR — Mobile toggle + dropdowns + scroll
// ================================================
function initNavbar() {
  const navbar   = document.querySelector('.navbar');
  const toggle   = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  // Mobile hamburger toggle
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      toggle.classList.toggle('open');
    });

    // Close nav when any link is clicked (on mobile)
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.classList.remove('open');
      });
    });
  }

  // Add shadow to navbar when scrolled down
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        navbar.style.boxShadow = '0 2px 24px rgba(0,0,0,0.9)';
      } else {
        navbar.style.boxShadow = '';
      }
    }, { passive: true }); // passive: true improves scroll performance
  }

  // Close mobile nav when clicking outside
  document.addEventListener('click', (e) => {
    if (navLinks && toggle) {
      if (!navbar.contains(e.target)) {
        navLinks.classList.remove('open');
        toggle.classList.remove('open');
      }
    }
  });
}

// ================================================
// 3. SAFE SITE BANNER
// Shows "This site is safe" green bar after delay
// ================================================
function initSafeBanner() {
  const banner = document.getElementById('safe-banner');
  if (!banner) return;

  // Don't show if user dismissed it this session
  if (sessionStorage.getItem('safe_banner_dismissed')) {
    banner.remove();
    return;
  }

  // Show banner after delay (site needs to load first)
  setTimeout(() => {
    banner.classList.add('show');
  }, CONFIG.safeBannerDelay);

  // Close button
  const closeBtn = banner.querySelector('.close-banner');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      banner.classList.remove('show');
      sessionStorage.setItem('safe_banner_dismissed', 'true');
      // Adjust page offset back
      document.body.style.paddingTop = '68px';
    });
  }

  // Adjust body padding to account for banner height
  setTimeout(() => {
    if (banner.classList.contains('show')) {
      const bannerHeight = banner.offsetHeight;
      document.body.style.paddingTop = (68 + bannerHeight) + 'px';
    }
  }, CONFIG.safeBannerDelay + 400);
}

// ================================================
// 4. SCROLL REVEAL
// Animates elements as they enter the viewport
// Elements need class="reveal" in HTML
// ================================================
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  // Use IntersectionObserver (better than scroll events)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Stop observing once visible
      }
    });
  }, {
    threshold: 0.12,  // Trigger when 12% of element is visible
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

// ================================================
// 5. ACTIVE NAV LINK
// Highlights the current page in navigation
// ================================================
function highlightActiveNav() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.navbar-links a');

  navLinks.forEach(link => {
    // Check if link href matches current page
    const linkPath = new URL(link.href, window.location.origin).pathname;
    if (linkPath === currentPath ||
        (currentPath === '/' && linkPath === '/index.html')) {
      link.classList.add('active');
    }
  });
}

// ================================================
// TOAST NOTIFICATION HELPER
// Call this from any JS file to show a toast
//
// Usage:
//   showToast('Message sent!', 'success')
//   showToast('Connection failed', 'error')
//   showToast('Looking for stranger...', 'info')
//
// Types: 'success' | 'error' | 'info'
// Duration: auto-removes after 3.5 seconds
// ================================================
function showToast(message, type = 'info', duration = 3500) {
  // Create toast container if it doesn't exist
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Icon for each toast type
  const icons = {
    success: '✅',
    error:   '❌',
    info:    '💬',
  };

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${icons[type] || '💬'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto-remove toast after duration
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ================================================
// UTILITY: Smooth scroll to element by ID
// Usage: scrollToSection('features')
// ================================================
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ================================================
// UTILITY: Format large numbers with commas
// Example: formatNumber(12456) → "12,456"
// ================================================
function formatNumber(num) {
  return num.toLocaleString('en-US');
}

// ================================================
// UTILITY: Random integer between min and max
// Used for active user count simulation
// ================================================
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Make helpers available globally (used in other JS files)
window.ChatSphere = {
  showToast,
  formatNumber,
  randomInt,
  CONFIG,
};
