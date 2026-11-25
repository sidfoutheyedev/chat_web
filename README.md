# 💬 ChatSphere — Modern Anonymous Stranger Chat

ViceTemple-inspired dark neon aesthetic ke sath banaya gaya high-performance **Next.js 16 + React 19 + Tailwind CSS** platform (Omegle / TalkWithStranger alternative) with **Real-Time WebSockets & WebRTC Peer-to-Peer Calls**.

---

## ⚡ Quick Start Commands (Sabhi Commands Ek Jagah)

### 1. Pehli Baar Dependencies Install Karna:
```bash
cd ~/Desktop/chatweb
npm install
```

### 2. Development Mode (Live Editing & Auto-Reload):
Jab code mein koi changes kar rahe ho aur live dekhna ho:
```bash
npm run dev
```
Browser mein open karo: 👉 **`http://localhost:3000`**

### 3. Production Build & Start (Fastest & Optimized):
Website ka optimized version banane aur chalane ke liye:
```bash
# Production Build banayein:
npm run build

# Production Server start karein (With Real-Time WebSocket Matchmaking Engine):
npm start
```
Browser mein open karo: 👉 **`http://localhost:3000`**

---

## 🎯 Real-Time Omegle-Style Matching (Kaise Test Karein)

Website ab **100% REAL users** ko aaps me connect karti hai:
- **Tab 1:** Ek browser tab me `http://localhost:3000` kholiye (Name: *Rahul*, Male, 22).
- **Tab 2:** Ek dusri browser window ya Incognito tab me `http://localhost:3000` kholiye (Name: *Priya*, Female, 21).
- **Instant Match:** Dono me jaise hi "Start Random Text Chat", "Voice Call", ya "Video Cam" par click karenge — **dono aaps me live connect ho jayenge!**
  - Text users match with text users, voice with voice, and video with video.
  - Topic room users are paired one-to-one only with someone who joined the same room; they wait until a room match is available.
  1. **Text Chat:** Real messages aur voice notes aaps me aate-jaate hain, typing status live dikhta hai.
  2. **Voice Call:** WebRTC peer connection ke zariye dono ek dusre ki awaaz real-time sun sakte hain microphone se!
  3. **Video Cam:** WebRTC video stream ke zariye dono ek dusre ka webcam live dekh sakte hain!
  4. **Next / Skip:** Jab koi "Next" dabata hai, dono unpair ho jate hain aur agle online stranger ko dhoondhte hain!

---

## 🌟 User Profile (Name, Gender, Age Match)

Users ab ek dusre se connect hote hi unki details dekh sakte hain:

### 👤 Profile Fields:
1. **Name / Nickname:** Apna koi bhi manpasand naam ya anonymous handle (e.g. *Rahul, Priya, StarGazer*).
2. **Gender Selector:**
   - 👨 **Male**
   - 👩 **Female**
   - 🌈 **Other / Non-Binary**
   - 👤 **Secret / Anonymous**
3. **Age Selector (Strictly 18+):** 18 se 60+ saal tak dropdown selector.
4. **Preference (Looking For):** 
   - 👥 Anyone (Fastest match)
   - 👩 Female
   - 👨 Male

### 💬 Chat Screen par kaise dikhta hai:
- Jaise hi do log connect hote hain, chat window ke header aur system message par saaf dikhta hai:  
  *`🎉 Connected! You are chatting with Priya (21 yrs • 👩 Female)`*
- Message bubbles ke upar sender ka naam likha hota hai (e.g. `Rahul (You)` aur `Priya`).
- Sidebar mein aapka khud ka profile badge hota hai jahan se aap kabhi bhi **"Edit Profile"** par click karke apna naam/age/gender badal sakte ho bina chat chhore.

---

## 🚀 Features Overview

| Feature | Description |
|---|---|
| 💬 **Random Text Chat** | Instant 1-on-1 text pairing, typing indicators, quick skips. |
| 🎙️ **Voice Call (HOT)** | High-definition anonymous audio call with pulsating soundwave visualizer. |
| 🎧 **Voice Notes** | Chat ke andar seedha mic button se voice messages record karke bhej sakte ho. |
| 📹 **Video Cam** | WebRTC face-to-face webcam pairing. |
| 🏠 **Topic Rooms** | One-to-one random text matching with another user in the same topic room. |
| 🔒 **Site is Safe Banner** | Green SSL encrypted safety banner on top of every page. |
| 🔞 **18+ Age Gate** | Adult-only verification modal that stores preference in localStorage. |
| 📈 **Live Online Counter** | Real-time animated online users count (`● 4,850 online`). |
| 💰 **AdSense Ready** | Dedicated `/privacy`, `/terms`, `/safety`, `/about` pages with reserved ad slots. |

---

## 📁 Project Structure (Next.js App Router)

```text
chatweb/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Homepage (Hero, Mode selector, Name/Gender/Age input)
│   │   ├── chat/page.tsx     # 1-on-1 Text chat with Name/Age/Gender badges & Voice Notes
│   │   ├── voice/page.tsx    # Audio Voice Call with ripple waves
│   │   ├── video/page.tsx    # Video Cam stream interface
│   │   ├── rooms/page.tsx    # Public topic chat rooms directory
│   │   ├── privacy/page.tsx  # Google AdSense ready Privacy Policy
│   │   ├── terms/page.tsx    # Terms of Service
│   │   ├── safety/page.tsx   # Trust & Safety Center & Community Rules
│   │   ├── about/page.tsx    # About ChatSphere story & mission
│   │   ├── layout.tsx        # Root layout (Navbar, Footer, SafeBanner, AgeGate)
│   │   └── globals.css       # Tailwind CSS & ViceTemple dark neon glow theme
│   ├── components/
│   │   ├── Navbar.tsx        # Top navigation with live online counter
│   │   ├── Footer.tsx        # Multi-column footer with AdSense legal links
│   │   ├── SafeBanner.tsx    # "ChatSphere is Safe" dismissible banner
│   │   └── AgeGateModal.tsx  # 18+ Adults only verification modal
│   └── hooks/
│       └── useLiveCounter.ts # Live user count animation hook
├── package.json              # Project scripts and dependencies
├── postcss.config.mjs        # PostCSS with @tailwindcss/postcss
├── tsconfig.json             # TypeScript configuration
└── legacy-html/              # Old static HTML backup files
```

---

## 🌐 Custom Domain Setup (Apne Domain Ke According Change Karne Ke Liye)

Jab aap apni website ko kisi custom domain (e.g. `https://yourdomain.com`) par deploy karein, toh in jagahon par domain update karein:

1. **Environment Variable (Sitemap ke liye):**
   `.env.local` (ya hosting platform ke environment variables) mein add karein:
   ```env
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```
   *(Ya directly `src/app/sitemap.ts` ki line 3 mein fallback URL change karein. Live sitemap `/sitemap.xml` par serve hota hai.)*

2. **OpenGraph Metadata (`src/app/layout.tsx`):**
   Line 25 par `url: "https://chatsphere.com"` ko apne domain (`https://yourdomain.com`) se replace karein.

3. **Contact Emails (Legal / Support Pages):**
   - `src/app/privacy/page.tsx` (lines 107-108): `privacy@chatsphere.com` → apna email
   - `src/app/terms/page.tsx` (lines 62-63): `support@chatsphere.com` → apna email
   - `src/app/safety/page.tsx` (lines 116-117): `safety@chatsphere.com` → apna email

---

## 🌐 Free 24/7 Live Deployment (Vercel)

Isko permanent internet par live karne ke liye:
1. Apna project GitHub repository par push karo.
2. [Vercel.com](https://vercel.com) par jao aur repo connect karo.
3. 1-click **Deploy** dabao — Vercel Next.js ko natively free mein deploy kar dega!
