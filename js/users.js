/* ================================================
   USERS.JS — ChatSphere
   Real-time active user counter

   HOW IT WORKS:
   - On page load: animates counter from 0 to current count
   - Every 5 seconds: gently updates the count (±small random change)
   - Connects to backend WebSocket if available
   - Falls back to simulated count if backend is offline

   HTML ELEMENTS IT UPDATES:
   - Any element with class="live-user-count" shows total online
   - Any element with class="live-chat-count" shows active chats
   - Any element with id="hero-user-count" in hero section
   ================================================ */

// ================================================
// INITIAL SETTINGS — Adjust these values
// ================================================
const USER_CONFIG = {
  baseCount: 4800,          // Starting user count (realistic base)
  variance: 150,            // ±how much count changes per update
  updateInterval: 5000,     // Update every 5 seconds (5000ms)
  countUpDuration: 2000,    // How long the initial count-up animation takes (ms)
  wsUrl: null,              // WebSocket URL — set this when backend is running
                            // Example: 'wss://your-domain.com/ws'
                            // Leave null to use simulated count
};

// ================================================
// INTERNAL STATE
// ================================================
let currentUserCount = USER_CONFIG.baseCount + randomInt(-200, 200);
let currentChatCount = Math.floor(currentUserCount / 2.3);
let wsConnection     = null; // WebSocket reference

// ================================================
// INITIALIZE — Runs on page load
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  // Try WebSocket first, fall back to simulation
  if (USER_CONFIG.wsUrl) {
    connectWebSocket();
  } else {
    startSimulation(); // Use fake count if no backend
  }

  // Animate the counter on first load
  animateAllCounters();
});

// ================================================
// WEBSOCKET CONNECTION (Real backend integration)
// Connect to your Node.js backend for real counts
// ================================================
function connectWebSocket() {
  try {
    wsConnection = new WebSocket(USER_CONFIG.wsUrl);

    wsConnection.onopen = () => {
      console.log('✅ Connected to live user counter');
    };

    // Backend sends: { online: 4823, chats: 2100 }
    wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.online) {
        currentUserCount = data.online;
        currentChatCount = data.chats || Math.floor(data.online / 2.3);
        updateAllCounters(currentUserCount, currentChatCount);
      }
    };

    wsConnection.onclose = () => {
      console.log('WebSocket closed, switching to simulation');
      startSimulation(); // Fall back if connection drops
    };

    wsConnection.onerror = () => {
      startSimulation(); // Fall back on error
    };
  } catch (err) {
    startSimulation();
  }
}

// ================================================
// SIMULATION MODE — Fake realistic-looking changes
// Used when no backend is connected
// ================================================
function startSimulation() {
  // Update count at regular intervals with small random changes
  setInterval(() => {
    // Randomly go up or down by a small amount
    const change = randomInt(-USER_CONFIG.variance, USER_CONFIG.variance);
    currentUserCount = Math.max(1000, currentUserCount + change); // Never go below 1000
    currentChatCount = Math.floor(currentUserCount / 2.3);

    // Smoothly update the displayed numbers
    updateAllCounters(currentUserCount, currentChatCount);
  }, USER_CONFIG.updateInterval);
}

// ================================================
// COUNT-UP ANIMATION — Numbers count from 0 on load
// Gives a satisfying visual on page arrival
// ================================================
function animateAllCounters() {
  // Animate all elements with class "live-user-count"
  document.querySelectorAll('.live-user-count').forEach(el => {
    countUp(el, 0, currentUserCount, USER_CONFIG.countUpDuration);
  });

  // Animate chat count elements
  document.querySelectorAll('.live-chat-count').forEach(el => {
    countUp(el, 0, currentChatCount, USER_CONFIG.countUpDuration);
  });

  // Animate specific hero element
  const heroCount = document.getElementById('hero-user-count');
  if (heroCount) {
    countUp(heroCount, 0, currentUserCount, USER_CONFIG.countUpDuration);
  }

  // Animate countries count (static)
  document.querySelectorAll('.live-countries-count').forEach(el => {
    countUp(el, 0, 180, USER_CONFIG.countUpDuration);
  });
}

// ================================================
// UPDATE ALL COUNTERS — Called on each interval
// Just changes the number, no full animation
// ================================================
function updateAllCounters(users, chats) {
  document.querySelectorAll('.live-user-count').forEach(el => {
    // Smooth number transition
    smoothUpdate(el, parseInt(el.dataset.current || 0), users);
    el.dataset.current = users;
  });

  document.querySelectorAll('.live-chat-count').forEach(el => {
    smoothUpdate(el, parseInt(el.dataset.current || 0), chats);
    el.dataset.current = chats;
  });

  const heroCount = document.getElementById('hero-user-count');
  if (heroCount) {
    smoothUpdate(heroCount, parseInt(heroCount.dataset.current || 0), users);
    heroCount.dataset.current = users;
  }
}

// ================================================
// SMOOTH UPDATE — Animates from old to new value
// Called when count changes on each interval
// ================================================
function smoothUpdate(element, from, to) {
  const duration = 1000;         // 1 second transition
  const steps    = 20;           // Number of animation frames
  const diff     = to - from;
  const stepSize = diff / steps;
  let   current  = from;
  let   step     = 0;

  const interval = setInterval(() => {
    current += stepSize;
    step++;
    element.textContent = formatNumber(Math.round(current));

    if (step >= steps) {
      element.textContent = formatNumber(to); // Ensure exact final value
      clearInterval(interval);
    }
  }, duration / steps);
}

// ================================================
// COUNT UP — Smooth animation from 0 to target
// Used on initial page load
// ================================================
function countUp(element, start, end, duration) {
  const startTime = performance.now();

  function update(currentTime) {
    // Calculate progress (0 to 1) with easing
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic: starts fast, slows at end
    const eased = 1 - Math.pow(1 - progress, 3);

    // Calculate current display value
    const current = Math.round(start + (end - start) * eased);
    element.textContent = formatNumber(current);
    element.dataset.current = current;

    // Continue animation until done
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// ================================================
// UTILITY: Format number with commas
// Local version (also defined in main.js)
// ================================================
function formatNumber(num) {
  return num.toLocaleString('en-US');
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
