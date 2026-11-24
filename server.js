const http = require('http');
const next = require('next');
const { Server: WebSocketServer } = require('ws');

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

// Each mode has its own queue; topic rooms get a separate text queue per room.
const queues = new Map();

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

function matchUsers(queueKey) {
  const queue = queues.get(queueKey);
  if (!queue || queue.length < 2) return;

  // Simple FIFO match or preference-based
  // Try to match users respecting preferences
  let matched = false;
  for (let i = 0; i < queue.length - 1; i++) {
    const userA = queue[i];
    for (let j = i + 1; j < queue.length; j++) {
      const userB = queue[j];

      // Check preference compatibility
      const aWantsB = !userA.profile?.lookingFor || userA.profile.lookingFor === 'anyone' || userA.profile.lookingFor === userB.profile?.gender;
      const bWantsA = !userB.profile?.lookingFor || userB.profile.lookingFor === 'anyone' || userB.profile.lookingFor === userA.profile?.gender;

      if (aWantsB && bWantsA) {
        // Pair userA and userB
        queue.splice(j, 1);
        queue.splice(i, 1);

        userA.partner = userB;
        userB.partner = userA;

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

        matched = true;
        break;
      }
    }
    if (matched) break;
  }

  // If no strict preference match after some wait, pair top two to avoid stalling
  if (!matched && queue.length >= 2) {
    const userA = queue.shift();
    const userB = queue.shift();

    userA.partner = userB;
    userB.partner = userA;

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
}

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  const wss = new WebSocketServer({ server });

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

            if (data.type === 'next' && ws.queueKey) {
              const queue = getQueue(ws.queueKey);
              queue.push(ws);
              ws.send(JSON.stringify({ 
                type: 'waiting', 
                queueLength: queue.length 
              }));
              matchUsers(ws.queueKey);
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
    });

    ws.on('error', (err) => {
      console.warn('WS socket error:', err.message);
    });
  });

  server.listen(port, () => {
    console.log(`> ChatSphere server running on http://localhost:${port} with Real-Time WebSockets`);
  });
}).catch(err => {
  console.error('Error starting Next.js server:', err);
  process.exit(1);
});
