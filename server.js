const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ── CONFIG ────────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'alibaba2024';
const DATA_FILE = path.join(__dirname, 'data', 'conversations.json');

// ── MULTER (screenshot uploads) ───────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── DATA HELPERS ──────────────────────────────────────────────────────────────
function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; }
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ── GEMINI ────────────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const SYSTEM_PROMPT = `Tu Ali Baba Marketing Pro ka AI sales agent hai. Tu WhatsApp pe customers se Roman Urdu mein baat karta hai. Replies SHORT rakho — 2-4 lines max. Natural conversation karo, menu spam bilkul mat karo.

BUSINESS:
- Ali Baba Marketing Pro — 2022 se chal raha hai
- Services: Instagram, Facebook, TikTok, YouTube followers/likes/views/comments/subscribers
- Payment: HAMESHA advance — koi exception nahi
- JazzCash/EasyPaisa/NayaPay/SadaPay/JS Bank: 03164324778 (Ali Raza)
- Meezan Bank: 11440107232622 (Ali Raza)
- Delivery: 1-12 ghante | Lifetime refill guarantee

PRICING (PKR):
INSTAGRAM:
  Followers: 1K=560 | 3K=1,650 | 5K=2,700 | 10K=5,500
  Likes: 500=170 | 1K=310
  Views: 1K=120 | 5K=550 | 10K=1,050
  Comments: 50=350 | 100=650

FACEBOOK:
  Followers: 1K=400 | 3K=1,150 | 5K=1,900 | 10K=3,800
  Likes: 300=280 | 500=450 | 1K=850
  Views: 1K=180 | 5K=850 | 10K=1,600
  Comments: 50=350 | 100=650
  Reviews: 50=1,200 | 100=2,200

TIKTOK:
  Followers: 1K=1,100 | 3K=3,200 | 5K=5,300 | 10K=10,500
  Likes: 500=150 | 1K=290 | 5K=1,300 | 10K=2,500
  Views: 5K=150 | 10K=290 | 50K=1,300 | 100K=2,500
  Monetization Views (NO DISCOUNT KABHI NAHI): 10K=2,200 | 20K=3,800 | 50K=8,500 | 100K=14,000

YOUTUBE (NO DISCOUNT KABHI NAHI — koi bhi haalat mein):
  Views: 1K=510 | 5K=2,500 | 10K=4,900
  Likes: 500=300 | 1K=550
  Subscribers: 500=4,300 | 1K=8,500

FB+IG ADS: 1 Din=1,500 | 3 Din=4,000 | 7 Din=7,500

ORDER FLOW — YEH BILKUL FOLLOW KARO:
Step 1: Customer rate pooche ya requirement bataye
  → Price batao, phir FORAN yeh bhi likho:
  "Agar confirm karna chahte ho to batao — payment advance hoti hai taake order fori process ho sake. Main account number send kar dunga. Aap payment kar ke screenshot aur apne account ka link send karna."

Step 2: Customer positively respond kare
  → Payment details do:
  "Jazak Allah ✅ Order Confirm!
  Payment in mein se kisi pe bhi kar saktay hain:
  💳 EasyPaisa/JazzCash/NayaPay/SadaPay/JS Bank
  Account: 03164324778 — Ali Raza
  🏦 Meezan Bank: 11440107232622 — Ali Raza
  Payment ke baad screenshot aur apne account ka public link bhejein. ⚡"

Step 3: Customer ne reply nahi kiya
  → "Brother kya main aapko account details send karoon? 😊"

SCREENSHOT CONFIRM KARNA:
  Jab customer screenshot bheje:
  - Amount check karo (order ke price se match kare)
  - Receiver: Ali Raza (03164324778 ya 11440107232622)
  - Status: Successful/Completed hona chahiye
  - Agar sab theek: "JazakAllah ✅ Payment confirm! Ab apne account ka public link bhejein taake order process ho sake. 1-12 ghante mein complete ho jayega ⚡"
  - Agar amount mismatch: "Brother screenshot mein amount alag hai. Sahi amount ki payment karein."

DISCOUNT RULES:
- Pehle kabhi discount offer/mention mat karo
- Pehli baar maange: "Prices already market competitive hain bhai"
- Dobara insist: thoda de sako (~10%) — percentage mat batao
- Zyada push: max 17% — yeh ceiling hai
- YouTube: KABHI nahi
- TikTok Monetization: KABHI nahi

IMPORTANT RULES:
- Customer se kabhi password mat maango — sirf public profile link
- "Organic" mat kaho — "yeh paid service hai, organic free hoti hai" samjhao
- Panel ka zikr mat karo jab tak customer na pooche
- Payment details sirf order confirm hone pe do
- Har message mein business name mat lagao
- Menu ya numbered list SIRF tab do jab customer pehli baar services pooche
- Warna natural baat karo

TRUST:
- Scam concern: "2022 se chal raha hai, hazaron satisfied customers hain. Office bhi hai: https://share.google/LnMTo0SMbd5aF8n8V"
- Half payment: acceptable — "Aap half karein, main half kaam karta hoon, phir baqi"
- Drop: "Lifetime refill guarantee hai"
- Safety: "Account bilkul safe — ban nahi hoga"
- Competitor kam price: "Wo scam karte hain — lalach dikha ke block kar dete hain"

POST ORDER:
- Followers/subscribers ke liye: "Account public rakhein delivery tak, phir private kar saktay hain"
- "Future mein username change mat karna — refill ke liye same chahiye"

Tone: Warm, brother/bhai, customer ki language mirror karo. Forceful nahi — guide karo.`;

async function callGemini(sessionId, userMessage) {
  const data = loadData();
  if (!data[sessionId]) {
    data[sessionId] = {
      id: sessionId,
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messages: [],
      status: 'active',
      orderConfirmed: false,
      paymentReceived: false
    };
  }

  data[sessionId].messages.push({
    role: 'user',
    content: userMessage,
    time: new Date().toISOString(),
    type: 'text'
  });
  data[sessionId].lastActivity = new Date().toISOString();

  // Build history for Gemini
  const history = [];
  const msgs = data[sessionId].messages;
  for (let i = 0; i < msgs.length - 1; i++) {
    history.push({
      role: msgs[i].role === 'user' ? 'user' : 'model',
      parts: [{ text: msgs[i].content }]
    });
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT
  });

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(userMessage);
  const reply = result.response.text();

  // Detect order/payment status
  if (reply.toLowerCase().includes('jazak allah') && reply.toLowerCase().includes('confirm')) {
    data[sessionId].orderConfirmed = true;
    data[sessionId].status = 'order_confirmed';
  }
  if (reply.toLowerCase().includes('payment confirm')) {
    data[sessionId].paymentReceived = true;
    data[sessionId].status = 'payment_received';
  }

  data[sessionId].messages.push({
    role: 'assistant',
    content: reply,
    time: new Date().toISOString(),
    type: 'text'
  });

  saveData(data);
  return reply;
}

// ── ROUTES ─────────────────────────────────────────────────────────────────────

// New session
app.post('/api/session', (req, res) => {
  const sessionId = uuidv4();
  const data = loadData();
  data[sessionId] = {
    id: sessionId,
    startTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    messages: [],
    status: 'active',
    orderConfirmed: false,
    paymentReceived: false
  };
  saveData(data);
  res.json({ sessionId });
});

// Chat
app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body;
  if (!sessionId || !message) return res.status(400).json({ error: 'Missing fields' });
  try {
    const reply = await callGemini(sessionId, message);
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI error', details: err.message });
  }
});

// Screenshot upload
app.post('/api/screenshot', upload.single('screenshot'), async (req, res) => {
  const { sessionId } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file' });

  const fileUrl = `/uploads/${req.file.filename}`;
  const data = loadData();

  if (data[sessionId]) {
    data[sessionId].messages.push({
      role: 'user',
      content: 'Customer ne payment screenshot bheji',
      imageUrl: fileUrl,
      time: new Date().toISOString(),
      type: 'image'
    });
    data[sessionId].lastActivity = new Date().toISOString();
    data[sessionId].status = 'payment_screenshot_received';
    saveData(data);
  }

  // Auto reply for screenshot
  const reply = await callGemini(sessionId, 'Maine payment kar di hai, screenshot dekho (image upload ki hai)');
  res.json({ reply, imageUrl: fileUrl });
});

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: Buffer.from(ADMIN_PASSWORD).toString('base64') });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

// Admin middleware
function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || Buffer.from(token, 'base64').toString() !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Get all conversations
app.get('/api/admin/conversations', adminAuth, (req, res) => {
  const data = loadData();
  const list = Object.values(data).sort((a, b) =>
    new Date(b.lastActivity) - new Date(a.lastActivity)
  );
  res.json(list);
});

// Get single conversation
app.get('/api/admin/conversations/:id', adminAuth, (req, res) => {
  const data = loadData();
  const conv = data[req.params.id];
  if (!conv) return res.status(404).json({ error: 'Not found' });
  res.json(conv);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Ali Baba Bot running on port ${PORT}`));
