/* ================================================
   SERVER.JS — ChatSphere Backend
   Node.js + Express + Socket.io

   WHAT THIS DOES:
   - Serves the frontend HTML files
   - Manages real-time user connections via Socket.io
   - Matches random strangers for 1-on-1 chat
   - Handles group chat rooms
   - Tracks and broadcasts active user count
   - Basic abuse prevention (rate limiting)

   SETUP:
   1. cd backend
   2. npm install
   3. node server.js  (or: npm start)

   REQUIREMENTS: Node.js 18+
   PORT: 3000 (change PORT env variable to override)
   ================================================ */

// ================================================
// IMPORTS — Load required packages
// ================================================
const express   = require('express');       // Web server framework
const http      = require('http');          // Node.js HTTP module
const { Server } = require('socket.io');   // Real-time WebSocket library
const path      = require('path');          // File path utilities
const cors      = require('cors');          // Cross-origin resource sharing
const rateLimit = require('express-rate-limit'); // Basic abuse prevention

// ================================================
// SERVER SETUP
// ================================================
const app    = express();
const server = http.createServer(app);      // Create HTTP server from Express app
const io     = new Server(server, {
  cors: {
    origin:  '*',                           // Allow any origin (restrict in production!)
    methods: ['GET', 'POST'],
  },
  pingTimeout:  60000,                      // Drop connection after 60s no response
  pingInterval: 25000,                      // Ping every 25s to keep connection alive
});

// ================================================
// CONFIGURATION
// ================================================
const PORT         = process.env.PORT || 3000; // Server port
const FRONTEND_DIR = path.join(__dirname, '..'); // Parent folder = frontend files

// ================================================
// MIDDLEWARE
// ================================================

// Serve static frontend files (HTML, CSS, JS)
app.use(express.static(FRONTEND_DIR));

// Parse JSON request bodies
app.use(express.json());

// CORS: Allow frontend to make requests
app.use(cors());

// Rate limiting: max 100 requests per 15 minutes per IP
// Prevents spam and DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please slow down.' },
});
app.use('/api', limiter);

// ================================================
// DATA STORAGE — In-memory (use Redis in production)
// ================================================

// Waiting users queue: users looking for a stranger
// { socketId: 'abc123', interests: ['gaming', 'music'] }
const waitingQueue = [];

// Active chat pairs: Map of socket ID → partner's socket ID
// { 'alice-id': 'bob-id', 'bob-id': 'alice-id' }
const activePairs = new Map();

// Group chat rooms: Map of room name → Set of socket IDs
// { 'Gaming Chat': Set(['alice-id', 'bob-id']) }
const chatRooms = new Map();

// User info: Map of socket ID → user data
// { 'alice-id': { nickname: 'Alice', joinedAt: Date } }
const users = new Map();

// Total connection stats
let totalConnections = 0;

// ================================================
// UTILITY FUNCTIONS
// ================================================

// Get current active user count
function getActiveUserCount() {
  return io.engine.clientsCount; // Real count from Socket.io
}

// Find a match for a user from the waiting queue
// Tries to match by shared interests first
function findMatch(socketId, interests = []) {
  if (waitingQueue.length === 0) return null;

  // Try interest-based matching first
  if (interests.length > 0) {
    const matchIdx = waitingQueue.findIndex(w =>
      w.interests.some(i => interests.includes(i))
    );
    if (matchIdx !== -1) {
      return waitingQueue.splice(matchIdx, 1)[0]; // Remove and return match
    }
  }

  // Fall back to first person in queue
  return waitingQueue.shift();
}

// Remove user from waiting queue
function removeFromQueue(socketId) {
  const idx = waitingQueue.findIndex(w => w.socketId === socketId);
  if (idx !== -1) waitingQueue.splice(idx, 1);
}

// Get partner's socket ID
function getPartner(socketId) {
  return activePairs.get(socketId);
}

// Disconnect a chat pair
function disconnectPair(socketId) {
  const partnerId = activePairs.get(socketId);
  activePairs.delete(socketId);
  if (partnerId) {
    activePairs.delete(partnerId);
    return partnerId;
  }
  return null;
}

// Broadcast active user count to all connected clients
function broadcastUserCount() {
  const count = getActiveUserCount();
  io.emit('user-count', {
    online: count,                           // Total online users
    chats:  Math.floor(activePairs.size / 2), // Active chat pairs
  });
}

// ================================================
// REST API ENDPOINTS
// ================================================

// GET /api/stats — Public stats endpoint
app.get('/api/stats', (req, res) => {
  res.json({
    online:    getActiveUserCount(),
    chats:     Math.floor(activePairs.size / 2),
    waiting:   waitingQueue.length,
    rooms:     chatRooms.size,
    total:     totalConnections,
  });
});

// GET / — Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// Serve all HTML pages
['random-chat', 'video-chat', 'chat-rooms', 'about', 'safety', 'privacy-policy', 'terms-conditions'].forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, `${page}.html`));
  });
});

// ================================================
// SOCKET.IO — Real-time event handling
// This is where the actual chat magic happens
// ================================================
io.on('connection', (socket) => {
  totalConnections++;
  console.log(`✅ User connected: ${socket.id} | Total: ${getActiveUserCount()}`);

  // Store basic user info
  users.set(socket.id, {
    socketId:  socket.id,
    nickname:  'Stranger',
    joinedAt:  new Date(),
    interests: [],
  });

  // Broadcast updated user count to everyone
  broadcastUserCount();

  // ---- RANDOM CHAT EVENTS ----

  // User wants to find a random stranger
  socket.on('find-stranger', (data = {}) => {
    const interests = data.interests || [];

    // Update user's interests
    const user = users.get(socket.id);
    if (user) user.interests = interests;

    // If already in a chat, disconnect first
    const oldPartner = disconnectPair(socket.id);
    if (oldPartner) {
      io.to(oldPartner).emit('stranger-disconnected');
    }

    // Try to find a match
    const match = findMatch(socket.id, interests);

    if (match) {
      // Found a match! Connect the pair
      activePairs.set(socket.id, match.socketId);
      activePairs.set(match.socketId, socket.id);

      // Notify both users they're connected
      socket.emit('matched',   { partnerId: match.socketId });
      io.to(match.socketId).emit('matched', { partnerId: socket.id });

      console.log(`💬 Matched: ${socket.id} ↔ ${match.socketId}`);
    } else {
      // No match yet — add to waiting queue
      waitingQueue.push({ socketId: socket.id, interests });
      socket.emit('waiting');
    }
  });

  // User sends a text message to their partner
  socket.on('message', (data) => {
    const partnerId = getPartner(socket.id);
    if (!partnerId) return; // No partner — ignore

    // Sanitize: limit message length to prevent abuse
    const text = String(data.text || '').substring(0, 500);
    if (!text.trim()) return;

    // Forward message to partner only
    io.to(partnerId).emit('stranger-message', { text });
  });

  // User is typing — notify partner
  socket.on('typing', () => {
    const partnerId = getPartner(socket.id);
    if (partnerId) io.to(partnerId).emit('stranger-typing');
  });

  // User stopped typing
  socket.on('stop-typing', () => {
    const partnerId = getPartner(socket.id);
    if (partnerId) io.to(partnerId).emit('stranger-stop-typing');
  });

  // User skips current stranger
  socket.on('skip', () => {
    const partnerId = disconnectPair(socket.id);

    // Tell old partner they were skipped
    if (partnerId) {
      io.to(partnerId).emit('stranger-disconnected');
    }

    // Find new stranger for the skipper
    socket.emit('find-stranger'); // Trigger find-stranger on client
  });

  // User cancels search
  socket.on('cancel', () => {
    removeFromQueue(socket.id);
    disconnectPair(socket.id);
  });

  // ---- GROUP CHAT ROOM EVENTS ----

  // User joins a named chat room
  socket.on('join-room', (data = {}) => {
    const roomName = String(data.room || 'General Chat').substring(0, 50);

    // Create room if it doesn't exist
    if (!chatRooms.has(roomName)) {
      chatRooms.set(roomName, new Set());
    }

    // Join Socket.io room (broadcasts)
    socket.join(roomName);
    chatRooms.get(roomName).add(socket.id);

    // Notify room that someone joined
    socket.to(roomName).emit('room-user-joined', {
      count: chatRooms.get(roomName).size,
    });

    // Send current room info to user
    socket.emit('room-joined', {
      room:  roomName,
      count: chatRooms.get(roomName).size,
    });
  });

  // User sends message to a room
  socket.on('room-message', (data = {}) => {
    const roomName = String(data.room || '').substring(0, 50);
    const text     = String(data.text || '').substring(0, 500);
    const nickname = String(data.nickname || 'Stranger').substring(0, 20);

    if (!text.trim() || !roomName) return;

    // Broadcast to everyone in room (including sender)
    io.to(roomName).emit('room-message', {
      text,
      nickname,
      time: new Date().toISOString(),
    });
  });

  // User leaves a room
  socket.on('leave-room', (data = {}) => {
    const roomName = data.room;
    if (roomName && chatRooms.has(roomName)) {
      socket.leave(roomName);
      chatRooms.get(roomName).delete(socket.id);
      socket.to(roomName).emit('room-user-left', {
        count: chatRooms.get(roomName).size,
      });
    }
  });

  // ---- DISCONNECT EVENT ----

  // User disconnects (browser closes, network drops, etc.)
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);

    // Notify chat partner
    const partnerId = disconnectPair(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('stranger-disconnected');
    }

    // Remove from waiting queue if searching
    removeFromQueue(socket.id);

    // Remove from all rooms
    chatRooms.forEach((members, roomName) => {
      if (members.has(socket.id)) {
        members.delete(socket.id);
        io.to(roomName).emit('room-user-left', { count: members.size });
      }
    });

    // Clean up user data
    users.delete(socket.id);

    // Broadcast updated count
    broadcastUserCount();
  });
});

// ================================================
// BROADCAST USER COUNT PERIODICALLY
// Sends live count to all clients every 5 seconds
// ================================================
setInterval(broadcastUserCount, 5000);

// ================================================
// START SERVER
// ================================================
server.listen(PORT, () => {
  console.log(`\n🚀 ChatSphere Server running!`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Port:    ${PORT}`);
  console.log(`\n💡 Tips:`);
  console.log(`   - Open http://localhost:${PORT} in your browser`);
  console.log(`   - In js/users.js, set wsUrl to 'ws://localhost:${PORT}'`);
  console.log(`   - In js/chat.js, set serverUrl to 'http://localhost:${PORT}'\n`);
});

// ================================================
// GRACEFUL SHUTDOWN
// Handles Ctrl+C (SIGINT) cleanly
// ================================================
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down ChatSphere server...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});
