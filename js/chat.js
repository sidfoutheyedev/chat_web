/* ================================================
   CHAT.JS — ChatSphere
   Chat interface logic for random-chat.html

   WHAT THIS FILE DOES:
   - Find / Skip stranger button logic
   - Send messages (Enter key or button click)
   - Render message bubbles (mine vs theirs)
   - Show typing indicator
   - System messages (connected, skipped, disconnected)
   - Chat timer (how long you've been chatting)
   - Interest tags input
   - Connect to backend Socket.io (when available)
   - Fallback demo mode if backend offline
   ================================================ */

// ================================================
// BACKEND CONFIG — Change this URL to your server
// ================================================
const CHAT_CONFIG = {
  serverUrl: null,            // Your Socket.io server URL
                              // Example: 'https://your-server.com'
                              // Set to null for demo/offline mode
  demoMode: true,             // Auto-enable demo if no server
  typingTimeout: 2000,        // Stop "typing..." after 2s of no input
  maxMessageLength: 500,      // Maximum characters per message
};

// ================================================
// STATE — Chat session variables
// ================================================
let socket            = null;   // Socket.io connection
let isConnected       = false;  // Are we paired with a stranger?
let isSearching       = false;  // Are we looking for a match?
let typingTimer       = null;   // Timer for typing indicator
let chatTimer         = null;   // Timer showing chat duration
let chatSeconds       = 0;      // Seconds into current chat
let isDemo            = CHAT_CONFIG.demoMode || !CHAT_CONFIG.serverUrl;

// Demo bot responses (shown when no backend)
const DEMO_RESPONSES = [
  'Hey! How are you? 😊',
  'Where are you from?',
  'That\'s interesting! Tell me more.',
  'haha lol 😂',
  'What are you into? Music, gaming?',
  'Same here! 🙌',
  'Oh wow, really?',
  'Have you used this site before?',
  'Cool! I like chatting here.',
  'What do you do for fun?',
  'Nice to meet you! 😄',
  'ASL? (age/sex/location)',
];

// ================================================
// INITIALIZE — Runs when page loads
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  setupChatUI();      // Set up all UI event listeners
  setupKeyboard();    // Enter to send, Shift+Enter for newline

  // Try connecting to backend if URL is set
  if (CHAT_CONFIG.serverUrl) {
    connectToServer();
  }
});

// ================================================
// CONNECT TO BACKEND (Socket.io)
// ================================================
function connectToServer() {
  // Load Socket.io from your server
  // Make sure your backend serves the Socket.io client script
  if (typeof io === 'undefined') {
    console.warn('Socket.io not loaded, using demo mode');
    isDemo = true;
    return;
  }

  socket = io(CHAT_CONFIG.serverUrl);

  // ---- Socket Events ----

  // Successfully matched with a stranger
  socket.on('matched', (data) => {
    isConnected = true;
    isSearching = false;
    setStatus('connected');
    addSystemMessage('🎉 You are now connected with a stranger!');
    startChatTimer();
    updateFindBtn('skip');
  });

  // Stranger sent a message
  socket.on('stranger-message', (data) => {
    hideTypingIndicator();
    addMessage(data.text, 'them');
  });

  // Stranger is typing
  socket.on('stranger-typing', () => {
    showTypingIndicator();
  });

  // Stranger stopped typing
  socket.on('stranger-stop-typing', () => {
    hideTypingIndicator();
  });

  // Stranger disconnected / skipped
  socket.on('stranger-disconnected', () => {
    isConnected = false;
    hideTypingIndicator();
    addSystemMessage('👋 Stranger has disconnected.');
    setStatus('disconnected');
    stopChatTimer();
    updateFindBtn('find');
  });

  // Waiting for a match
  socket.on('waiting', () => {
    isSearching = true;
    setStatus('searching');
    addSystemMessage('🔍 Looking for a stranger...');
    updateFindBtn('searching');
  });
}

// ================================================
// SETUP UI — All button click listeners
// ================================================
function setupChatUI() {
  // "Find / Skip" button
  const findBtn = document.getElementById('find-stranger-btn');
  if (findBtn) {
    findBtn.addEventListener('click', handleFindSkip);
  }

  // Send button
  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }

  // Report button
  const reportBtn = document.getElementById('report-btn');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => {
      if (isConnected) {
        addSystemMessage('⚠️ User has been reported. Thank you for keeping ChatSphere safe.');
        ChatSphere.showToast('User reported to moderators', 'success');
      }
    });
  }
}

// ================================================
// KEYBOARD SHORTCUTS
// Enter = send, Shift+Enter = newline
// ================================================
function setupKeyboard() {
  const input = document.getElementById('message-input');
  if (!input) return;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Don't add new line
      sendMessage();
    }
  });

  // Detect typing and emit to backend
  input.addEventListener('input', () => {
    if (socket && isConnected) {
      socket.emit('typing');

      // Stop typing after 2 seconds of no input
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        if (socket) socket.emit('stop-typing');
      }, CHAT_CONFIG.typingTimeout);
    }
  });
}

// ================================================
// HANDLE FIND / SKIP
// ================================================
function handleFindSkip() {
  if (!isConnected && !isSearching) {
    // Start searching for a stranger
    startSearch();
  } else if (isConnected) {
    // Skip current stranger
    skipStranger();
  } else if (isSearching) {
    // Cancel search
    cancelSearch();
  }
}

function startSearch() {
  if (isDemo) {
    // Demo mode: simulate finding a stranger after delay
    isSearching = true;
    setStatus('searching');
    clearMessages();
    addSystemMessage('🔍 Looking for a stranger...');
    updateFindBtn('searching');

    setTimeout(() => {
      isConnected = true;
      isSearching = false;
      setStatus('connected');
      addSystemMessage('🎉 You are now connected with a stranger!');
      startChatTimer();
      updateFindBtn('skip');

      // Bot sends a greeting after short delay
      setTimeout(() => {
        const greeting = DEMO_RESPONSES[0];
        addMessage(greeting, 'them');
      }, 1200);
    }, randomInt(1500, 3000)); // Random delay 1.5-3 seconds
  } else if (socket) {
    clearMessages();
    socket.emit('find-stranger', {
      interests: getInterestTags(),
    });
  }
}

function skipStranger() {
  isConnected = false;
  hideTypingIndicator();
  addSystemMessage('⏭️ You skipped. Looking for another stranger...');
  stopChatTimer();

  if (isDemo) {
    // Demo: immediately start searching again
    setTimeout(startSearch, 500);
  } else if (socket) {
    socket.emit('skip');
  }
}

function cancelSearch() {
  isSearching = false;
  setStatus('disconnected');
  addSystemMessage('❌ Search cancelled.');
  updateFindBtn('find');

  if (socket) socket.emit('cancel');
}

// ================================================
// SEND MESSAGE
// ================================================
function sendMessage() {
  const input = document.getElementById('message-input');
  if (!input) return;

  const text = input.value.trim();

  // Validate: not empty, not too long
  if (!text) return;
  if (text.length > CHAT_CONFIG.maxMessageLength) {
    ChatSphere.showToast(`Message too long (max ${CHAT_CONFIG.maxMessageLength} chars)`, 'error');
    return;
  }
  if (!isConnected) {
    ChatSphere.showToast('Find a stranger first!', 'info');
    return;
  }

  // Add my message to screen
  addMessage(text, 'me');

  // Send to backend / simulate
  if (socket && !isDemo) {
    socket.emit('message', { text });
    socket.emit('stop-typing');
  } else {
    // Demo: bot replies after a random delay
    simulateBotReply();
  }

  // Clear input field
  input.value = '';
  input.style.height = 'auto'; // Reset height if auto-expanded
}

// ================================================
// DEMO BOT REPLY — Simulates stranger replying
// ================================================
function simulateBotReply() {
  // Show typing indicator
  setTimeout(() => {
    showTypingIndicator();
  }, 500);

  // Send reply after random delay
  const delay = randomInt(1500, 4000);
  setTimeout(() => {
    hideTypingIndicator();
    const reply = DEMO_RESPONSES[randomInt(1, DEMO_RESPONSES.length - 1)];
    addMessage(reply, 'them');
  }, delay);
}

// ================================================
// ADD MESSAGE — Renders a chat bubble to screen
// type: 'me' | 'them'
// ================================================
function addMessage(text, type) {
  const container = document.getElementById('messages-container');
  if (!container) return;

  // Create message row
  const row = document.createElement('div');
  row.className = `msg-row ${type}`;

  // Create message bubble
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = escapeHtml(text).replace(/\n/g, '<br>'); // Allow line breaks

  // Add timestamp
  const time = document.createElement('span');
  time.className = 'msg-time';
  time.textContent = getTimeNow();

  row.appendChild(bubble);
  container.appendChild(row);

  // Scroll to latest message
  scrollToBottom(container);

  // Update message count in sidebar if present
  const msgCount = document.getElementById('msg-count');
  if (msgCount) {
    msgCount.textContent = (parseInt(msgCount.textContent || 0) + 1);
  }
}

// ================================================
// SYSTEM MESSAGES — Centered info messages
// ================================================
function addSystemMessage(text) {
  const container = document.getElementById('messages-container');
  if (!container) return;

  const msg = document.createElement('div');
  msg.className = 'msg-system';
  msg.textContent = text;
  container.appendChild(msg);
  scrollToBottom(container);
}

// ================================================
// TYPING INDICATOR — Shows "..." animation
// ================================================
function showTypingIndicator() {
  const container = document.getElementById('messages-container');
  if (!container) return;

  // Don't add duplicate typing indicators
  if (document.getElementById('typing-indicator')) return;

  const typing = document.createElement('div');
  typing.className = 'msg-row them';
  typing.id = 'typing-indicator';
  typing.innerHTML = `
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  container.appendChild(typing);
  scrollToBottom(container);
}

function hideTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}

// ================================================
// STATUS UPDATES — Updates the status text
// ================================================
function setStatus(status) {
  const statusEl = document.getElementById('chat-status');
  if (!statusEl) return;

  const statuses = {
    connected:    { text: 'Connected ✓',       color: 'var(--green)' },
    searching:    { text: 'Searching...',       color: 'var(--yellow)' },
    disconnected: { text: 'Not connected',      color: 'var(--text-muted)' },
  };

  const s = statuses[status] || statuses.disconnected;
  statusEl.textContent = s.text;
  statusEl.style.color  = s.color;
}

// ================================================
// FIND BUTTON STATE — Changes button text/style
// ================================================
function updateFindBtn(state) {
  const btn = document.getElementById('find-stranger-btn');
  if (!btn) return;

  const states = {
    find:      { text: '🔍 Find Stranger',  cls: 'btn-primary' },
    skip:      { text: '⏭️ Skip Stranger',  cls: 'btn-secondary' },
    searching: { text: '⏳ Searching...',   cls: 'btn-ghost' },
  };

  const s = states[state] || states.find;
  btn.textContent  = s.text;
  btn.className    = `btn ${s.cls} btn-full`;
}

// ================================================
// CHAT TIMER — Counts seconds with current stranger
// ================================================
function startChatTimer() {
  chatSeconds = 0;
  chatTimer = setInterval(() => {
    chatSeconds++;
    const timerEl = document.getElementById('chat-timer');
    if (timerEl) {
      timerEl.textContent = formatDuration(chatSeconds);
    }
  }, 1000);
}

function stopChatTimer() {
  if (chatTimer) {
    clearInterval(chatTimer);
    chatTimer = null;
  }
  const timerEl = document.getElementById('chat-timer');
  if (timerEl) timerEl.textContent = '0:00';
}

// ================================================
// INTEREST TAGS — Get selected tags
// ================================================
function getInterestTags() {
  const tags = [];
  document.querySelectorAll('.interest-tag.selected').forEach(tag => {
    tags.push(tag.dataset.tag);
  });
  return tags;
}

// Setup interest tag clicks
document.querySelectorAll('.interest-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    tag.classList.toggle('selected');
  });
});

// ================================================
// UTILITY FUNCTIONS
// ================================================

// Clear all messages from chat window
function clearMessages() {
  const container = document.getElementById('messages-container');
  if (container) container.innerHTML = '';
}

// Auto-scroll to bottom of messages
function scrollToBottom(container) {
  container.scrollTop = container.scrollHeight;
}

// Get current time formatted as "3:45 PM"
function getTimeNow() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Format seconds as "M:SS"
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Escape HTML to prevent XSS attacks in messages
function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
