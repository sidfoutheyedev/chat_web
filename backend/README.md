# ChatSphere Backend — Setup Guide

## 🚀 Quick Start

```bash
# 1. Go to backend folder
cd backend

# 2. Install packages
npm install

# 3. Start the server
npm start
# OR for auto-restart on file change (development):
npm run dev
```

Server will run at: **http://localhost:3000**

---

## 📡 Connecting Frontend to Backend

### Step 1: Connect the user counter (`js/users.js`)
```js
// Find this line in js/users.js:
wsUrl: null,

// Change it to:
wsUrl: 'ws://localhost:3000',  // Local development
// OR for production:
wsUrl: 'wss://your-domain.com',
```

### Step 2: Connect the chat (`js/chat.js`)
```js
// Find this line in js/chat.js:
serverUrl: null,

// Change it to:
serverUrl: 'http://localhost:3000',  // Local development
// OR for production:
serverUrl: 'https://your-domain.com',
```

### Step 3: Add Socket.io to HTML pages
Add this script tag to `random-chat.html` and `video-chat.html` BEFORE chat.js:
```html
<script src="http://localhost:3000/socket.io/socket.io.js"></script>
```

---

## 🌍 Deploy to Production (Free Options)

### Option 1: Railway (Recommended — Free tier)
1. Create account at https://railway.app
2. Connect your GitHub repo
3. Railway auto-detects Node.js and deploys
4. Set `PORT` environment variable (Railway provides this)

### Option 2: Render (Free)
1. Create account at https://render.com
2. New Web Service → connect GitHub
3. Build command: `npm install`
4. Start command: `node server.js`

### Option 3: Heroku
```bash
heroku create chatsphere-app
git push heroku main
heroku open
```

### Option 4: VPS (DigitalOcean, Linode, etc.)
```bash
# Install Node.js on your VPS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (keeps server running)
npm install -g pm2

# Start with PM2
pm2 start server.js --name chatsphere
pm2 save           # Auto-start on reboot
pm2 startup        # Enable startup script
```

---

## 🔧 Environment Variables

Create a `.env` file in the `backend/` folder:
```env
PORT=3000
NODE_ENV=production
```

---

## 📊 API Endpoints

| Endpoint     | Method | Description               |
|-------------|--------|---------------------------|
| `/api/stats` | GET    | Get live user stats       |

**Example response:**
```json
{
  "online": 4823,
  "chats": 2100,
  "waiting": 15,
  "rooms": 8,
  "total": 150000
}
```

---

## 🔌 Socket.io Events

### Client → Server (what frontend sends)
| Event           | Data                           | Description              |
|----------------|--------------------------------|--------------------------|
| `find-stranger` | `{ interests: ['gaming'] }`   | Start searching          |
| `message`       | `{ text: 'Hello!' }`          | Send chat message        |
| `typing`        | —                              | Notify partner typing    |
| `stop-typing`   | —                              | Stop typing indicator    |
| `skip`          | —                              | Skip current stranger    |
| `cancel`        | —                              | Cancel search            |
| `join-room`     | `{ room: 'Gaming Chat' }`     | Join group chat room     |
| `room-message`  | `{ room, text, nickname }`    | Send room message        |
| `leave-room`    | `{ room: 'Gaming Chat' }`     | Leave group room         |

### Server → Client (what backend sends)
| Event                  | Data                      | Description                    |
|-----------------------|---------------------------|--------------------------------|
| `matched`              | `{ partnerId }`           | Paired with a stranger         |
| `waiting`              | —                         | Still searching                |
| `stranger-message`     | `{ text }`                | Message from partner           |
| `stranger-typing`      | —                         | Partner is typing              |
| `stranger-stop-typing` | —                         | Partner stopped typing         |
| `stranger-disconnected`| —                         | Partner left/skipped           |
| `user-count`           | `{ online, chats }`       | Live user count update         |
| `room-joined`          | `{ room, count }`         | Joined room successfully       |
| `room-message`         | `{ text, nickname, time }`| New message in room            |
| `room-user-joined`     | `{ count }`               | Someone joined the room        |
| `room-user-left`       | `{ count }`               | Someone left the room          |

---

## 🛡️ Security Notes

- Change CORS origin in `server.js` from `'*'` to your actual domain in production
- Add HTTPS using Let's Encrypt (free) with Certbot
- Consider adding Redis for scaling across multiple server instances
- Add database (MongoDB/PostgreSQL) for user accounts and persistent features

---

## 📦 Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Real-time:** Socket.io 4
- **Rate limiting:** express-rate-limit
- **Dev:** nodemon

---

Need help? Contact: hello@chatsphere.com
