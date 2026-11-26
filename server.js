require('dotenv').config();

const http = require('http');
const next = require('next');
const { Server: WebSocketServer } = require('ws');

const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.APP_HOST || '0.0.0.0';
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: __dirname, webpack: true });
const handle = app.getRequestHandler();

// Each mode has its own queue; topic rooms get a separate text queue per room.
const queues = new Map();

// Isolated group chat rooms (city rooms)
const chatRooms = new Map();

// Track online stats
let totalConnected = 0;

function removeFromQueue(ws) {
  const keys = [...queues.keys()];
  for (const key of keys) {
    const queue = queues.get(key);
    if (!queue) continue;
    const remaining = queue.filter(client => client !== ws);
    if (remaining.length) queues.set(key, remaining);
    else queues.delete(key);
  }
}

function getQueue(queueKey) {
  if (!queues.has(queueKey)) queues.set(queueKey, []);
  return queues.get(queueKey);
}

function isCompatible(userA, userB) {
  const aPref = userA.profile?.lookingFor;
  const bPref = userB.profile?.lookingFor;
  const aWantsB = !aPref || aPref === 'any' || aPref === 'anyone' || aPref === userB.profile?.gender;
  const bWantsA = !bPref || bPref === 'any' || bPref === 'anyone' || bPref === userA.profile?.gender;
  return aWantsB && bWantsA;
}

function pairUsers(userA, userB) {
  userA.partner = userB;
  userB.partner = userA;
  userA.lastPartner = userB;
  userB.lastPartner = userA;

  userA.send(JSON.stringify({
    type: 'matched',
    partnerProfile: userB.profile || { name: 'Stranger', gender: 'other', age: '21' },
    initiator: true
  }));

  userB.send(JSON.stringify({
    type: 'matched',
    partnerProfile: userA.profile || { name: 'Stranger', gender: 'other', age: '21' },
    initiator: false
  }));
}

function matchUsers(queueKey) {
  const queue = queues.get(queueKey);
  if (!queue || queue.length < 2) return;

  // Pair all available free users in this isolated pool
  while (queue.length >= 2) {
    let matched = false;

    // 1. Prefer compatible users who weren't just paired together
    for (let i = 0; i < queue.length - 1; i++) {
      const userA = queue[i];
      for (let j = i + 1; j < queue.length; j++) {
        const userB = queue[j];
        if (userA.lastPartner === userB && queue.length > 2) continue;
        if (isCompatible(userA, userB)) {
          queue.splice(j, 1);
          queue.splice(i, 1);
          pairUsers(userA, userB);
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

    // 2. Fallback: pair any two free users (avoiding immediate re-match if >2 waiting)
    if (!matched && queue.length >= 2) {
      const userA = queue.shift();
      let partnerIdx = 0;
      if (queue.length > 1 && userA.lastPartner === queue[0]) {
        partnerIdx = 1;
      }
      const userB = queue.splice(partnerIdx, 1)[0];
      pairUsers(userA, userB);
    }
  }
}

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const pathname = (req.url || '').split('?')[0];
    if (pathname === '/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
    // Let Next.js handle /_next/webpack-hmr and other internal upgrades
  });

  wss.on('connection', (ws) => {
    totalConnected++;
    ws.isAlive = true;
    ws.partner = null;
    ws.currentMode = null;
    ws.profile = null;

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw);

        switch (data.type) {
          case 'join': {
            // Disconnect old partner if any
            if (ws.partner) {
              try {
                ws.partner.send(JSON.stringify({ type: 'partner-disconnected' }));
                ws.partner.partner = null;
              } catch (_) {}
              ws.partner = null;
            }

            removeFromQueue(ws);
            ws.currentMode = ['text', 'voice', 'video'].includes(data.mode) ? data.mode : 'text';
            const requestedRoom = typeof data.roomId === 'string' ? data.roomId : '';
            ws.roomId = ws.currentMode === 'text' && /^[a-z0-9-]{1,40}$/.test(requestedRoom)
              ? requestedRoom
              : null;
            ws.queueKey = ws.roomId ? `room:${ws.roomId}` : `mode:${ws.currentMode}`;
            ws.profile = data.profile || { name: 'Anonymous', gender: 'other', age: '21' };

            // Add to queue
            getQueue(ws.queueKey).push(ws);

            ws.send(JSON.stringify({ 
              type: 'waiting', 
              queueLength: queues.get(ws.queueKey).length 
            }), (err) => {
              if (err) console.error('Unable to send waiting message:', err.message);
            });

            // Attempt matching
            matchUsers(ws.queueKey);
            break;
          }

          case 'message': {
            if (ws.partner && ws.partner.readyState === ws.OPEN) {
              ws.partner.send(JSON.stringify({
                type: 'message',
                text: data.text,
                time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }));
            }
            break;
          }

          case 'voice-note': {
            if (ws.partner && ws.partner.readyState === ws.OPEN) {
              ws.partner.send(JSON.stringify({
                type: 'voice-note',
                audioData: data.audioData,
                voiceDuration: data.voiceDuration,
                time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }));
            }
            break;
          }

          case 'typing': {
            if (ws.partner && ws.partner.readyState === ws.OPEN) {
              ws.partner.send(JSON.stringify({
                type: 'typing',
                isTyping: !!data.isTyping
              }));
            }
            break;
          }

          case 'signal': {
            // WebRTC offer / answer / ICE candidate
            if (ws.partner && ws.partner.readyState === ws.OPEN) {
              ws.partner.send(JSON.stringify({
                type: 'signal',
                data: data.data
              }));
            }
            break;
          }

          // ─────────────────────────────────────────────────────
          // CITY CHAT ROOMS (group, isolated per room)
          // ─────────────────────────────────────────────────────
          case 'room-join': {
            const rId = typeof data.roomId === 'string' ? data.roomId.slice(0, 60) : '';
            if (!rId) break;

            // Leave previous room if any
            if (ws.chatRoom) {
              const prevRoom = chatRooms.get(ws.chatRoom);
              if (prevRoom) {
                prevRoom.delete(ws);
                // Notify others
                prevRoom.forEach(member => {
                  try { member.send(JSON.stringify({ type: 'room-user-left', userId: ws.chatRoomUserId, userName: ws.chatRoomProfile?.name })); } catch(_){}
                });
              }
            }

            ws.chatRoom = rId;
            ws.chatRoomProfile = data.profile || { name: 'Anonymous', color: 'bg-purple-500' };
            ws.chatRoomUserId = `${rId}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

            if (!chatRooms.has(rId)) chatRooms.set(rId, new Set());
            const room = chatRooms.get(rId);

            // Send current room state to joiner
            const roomUsers = [...room].map(m => ({
              id: m.chatRoomUserId,
              name: m.chatRoomProfile?.name || 'Anonymous',
              color: m.chatRoomProfile?.color || 'bg-purple-500',
              initial: (m.chatRoomProfile?.name || 'A')[0].toUpperCase()
            }));
            ws.send(JSON.stringify({ type: 'room-state', users: roomUsers, cityName: rId }));

            // Notify others of new joiner
            room.forEach(member => {
              try { member.send(JSON.stringify({
                type: 'room-user-joined',
                user: { id: ws.chatRoomUserId, name: ws.chatRoomProfile.name, color: ws.chatRoomProfile.color || 'bg-purple-500', initial: ws.chatRoomProfile.name[0].toUpperCase() }
              })); } catch(_){}
            });

            room.add(ws);
            break;
          }

          case 'room-leave': {
            if (ws.chatRoom) {
              const room = chatRooms.get(ws.chatRoom);
              if (room) {
                room.delete(ws);
                room.forEach(member => {
                  try { member.send(JSON.stringify({ type: 'room-user-left', userId: ws.chatRoomUserId, userName: ws.chatRoomProfile?.name })); } catch(_){}
                });
                if (room.size === 0) chatRooms.delete(ws.chatRoom);
              }
              ws.chatRoom = null;
              ws.chatRoomProfile = null;
              ws.chatRoomUserId = null;
            }
            break;
          }

          case 'room-message': {
            if (!ws.chatRoom) break;
            const room = chatRooms.get(ws.chatRoom);
            if (!room) break;
            const payload = JSON.stringify({
              type: 'room-message',
              msgId: data.msgId || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              fromId: ws.chatRoomUserId,
              fromName: ws.chatRoomProfile?.name || 'Anonymous',
              fromColor: ws.chatRoomProfile?.color || 'bg-purple-500',
              text: data.text,
              time: data.time
            });
            room.forEach(member => {
              if (member !== ws && member.readyState === ws.OPEN) {
                try { member.send(payload); } catch(_){}
              }
            });
            break;
          }

          case 'room-voice-note': {
            if (!ws.chatRoom) break;
            const room = chatRooms.get(ws.chatRoom);
            if (!room) break;
            const payload = JSON.stringify({
              type: 'room-voice-note',
              msgId: data.msgId || `vn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              fromId: ws.chatRoomUserId,
              fromName: ws.chatRoomProfile?.name || 'Anonymous',
              fromColor: ws.chatRoomProfile?.color || 'bg-purple-500',
              audioData: data.audioData,
              voiceDuration: data.voiceDuration,
              time: data.time
            });
            room.forEach(member => {
              if (member !== ws && member.readyState === ws.OPEN) {
                try { member.send(payload); } catch(_){}
              }
            });
            break;
          }

          case 'room-signal': {
            // WebRTC signal for in-room voice call
            if (!ws.chatRoom) break;
            const room = chatRooms.get(ws.chatRoom);
            if (!room) break;
            const targetId = data.toId;
            room.forEach(member => {
              if (member.chatRoomUserId === targetId && member.readyState === ws.OPEN) {
                try { member.send(JSON.stringify({ type: 'room-signal', fromId: ws.chatRoomUserId, data: data.data })); } catch(_){}
              }
            });
            break;
          }

          case 'room-reaction': {
            // Broadcast emoji reaction to all room members
            if (!ws.chatRoom) break;
            const room = chatRooms.get(ws.chatRoom);
            if (!room) break;
            const payload = JSON.stringify({
              type: 'room-reaction',
              msgId: data.msgId,
              emoji: data.emoji,
              fromId: ws.chatRoomUserId,
              fromName: ws.chatRoomProfile?.name || 'Anonymous'
            });
            room.forEach(member => {
              if (member !== ws && member.readyState === ws.OPEN) {
                try { member.send(payload); } catch(_){}
              }
            });
            break;
          }

          case 'room-speaking': {
            if (!ws.chatRoom) break;
            const room = chatRooms.get(ws.chatRoom);
            if (!room) break;
            room.forEach(member => {
              if (member !== ws && member.readyState === ws.OPEN) {
                try { member.send(JSON.stringify({ type: 'room-speaking', userId: ws.chatRoomUserId, speaking: !!data.speaking })); } catch(_){}
              }
            });
            break;
          }

          case 'leave':
          case 'next': {
            if (ws.partner) {
              try {
                ws.partner.send(JSON.stringify({ type: 'partner-disconnected' }));
                ws.partner.partner = null;
              } catch (_) {}
              ws.partner = null;
            }
            removeFromQueue(ws);

            if (data.type === 'next') {
              // Update profile/mode if client sent them along with 'next'
              if (data.profile) ws.profile = data.profile;
              if (data.mode && ['text', 'voice', 'video'].includes(data.mode)) {
                ws.currentMode = data.mode;
                const requestedRoom = typeof data.roomId === 'string' ? data.roomId : '';
                ws.roomId = ws.currentMode === 'text' && /^[a-z0-9-]{1,40}$/.test(requestedRoom)
                  ? requestedRoom
                  : null;
                ws.queueKey = ws.roomId ? `room:${ws.roomId}` : `mode:${ws.currentMode}`;
              }

              if (ws.queueKey) {
                const queue = getQueue(ws.queueKey);
                queue.push(ws);
                ws.send(JSON.stringify({ 
                  type: 'waiting', 
                  queueLength: queue.length 
                }));
                matchUsers(ws.queueKey);
              }
            }
            break;
          }
        }
      } catch (err) {
        console.error('WS message handling error:', err);
      }
    });

    ws.on('close', () => {
      totalConnected = Math.max(0, totalConnected - 1);
      if (ws.partner) {
        try {
          ws.partner.send(JSON.stringify({ type: 'partner-disconnected' }));
          ws.partner.partner = null;
        } catch (_) {}
        ws.partner = null;
      }
      removeFromQueue(ws);
      // Clean up chat room membership
      if (ws.chatRoom) {
        const room = chatRooms.get(ws.chatRoom);
        if (room) {
          room.delete(ws);
          room.forEach(member => {
            try { member.send(JSON.stringify({ type: 'room-user-left', userId: ws.chatRoomUserId, userName: ws.chatRoomProfile?.name })); } catch(_){}
          });
          if (room.size === 0) chatRooms.delete(ws.chatRoom);
        }
      }
    });

    ws.on('error', (err) => {
      console.warn('WS socket error:', err.message);
    });
  });

  server.listen(port, () => {
    console.log(`> TalkToStranger server running on http://localhost:${port} with Real-Time WebSockets`);
  server.listen(port, host, () => {
    console.log(`> ChatSphere server running on http://localhost:${port} with Real-Time WebSockets`);
  });
}).catch(err => {
  console.error('Error starting Next.js server:', err);
  process.exit(1);
});
