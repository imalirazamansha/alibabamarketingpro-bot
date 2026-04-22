const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'alibaba2024';
const DATA_FILE = path.join(__dirname, 'data', 'conversations.json');

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, path.join(__dirname, 'public', 'uploads')); },
  filename: (req, file, cb) => { cb(null, `${Date.now()}-${file.originalname}`); }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; }
}
function saveData(data) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); } catch(e) { console.error('Save error:', e); }
}

const SYSTEM_PROMPT = `Tu Ali Baba Marketing Pro ka AI sales agent hai. Tu customers se Roman Urdu mein baat karta hai. Replies SHORT rakho 2-4 lines max. Natural conversation karo, menu spam bilkul mat karo.

BUSINESS: Ali Baba Marketing Pro 2022 se. Payment HAMESHA advance. JazzCash/EasyPaisa/NayaPay/SadaPay/JS Bank: 03164324778 (Ali Raza). Meezan Bank: 11440107232622 (Ali Raza). Delivery 1-12 ghante. Lifetime refill guarantee.

PRICING PKR:
INSTAGRAM: Followers 1K=560|3K=1650|5K=2700|10K=5500. Likes 500=170|1K=310. Views 1K=120|5K=550|10K=1050. Comments 50=350|100=650.
FACEBOOK: Followers 1K=400|3K=1150|5K=1900|10K=3800. Likes 300=280|500=450|1K=850. Views 1K=180|5K=850|10K=1600. Comments 50=350|100=650. Reviews 50=1200|100=2200.
TIKTOK: Followers 1K=1100|3K=3200|5K=5300|10K=10500. Likes 500=150|1K=290|5K=1300|10K=2500. Views 5K=150|10K=290|50K=1300|100K=2500. Monetization NO DISCOUNT: 10K=2200|20K=3800|50K=8500|100K=14000.
YOUTUBE NO DISCOUNT EVER: Views 1K=510|5K=2500|10K=4900. Likes 500=300|1K=550. Subs 500=4300|1K=8500.
ADS: 1Din=1500|3Din=4000|7Din=7500.

ORDER FLOW:
Step1: Customer rate pooche ya requirement bataye. Price batao PHIR FORAN likho: "Agar confirm karna chahte ho to batao - payment advance hoti hai taake order fori process ho sake. Main account number send kar dunga."
Step2: Customer confirm kare. Likho: "Jazak Allah Order Confirm! Payment in mein se kisi pe bhi kar saktay hain: EasyPaisa/JazzCash/NayaPay/SadaPay/JS Bank: 03164324778 Ali Raza. Meezan Bank: 11440107232622 Ali Raza. Payment ke baad screenshot aur apne account ka public link bhejein."
Step3: No reply: "Brother kya main aapko account details send karoon?"

DISCOUNT: Never offer first. First request: prices competitive hain. Second: ~10% de sako. Third: max 17%. YouTube KABHI nahi. TikTok Monetization KABHI nahi.

RULES: Password kabhi mat maango sirf public link. Panel zikr mat karo. Payment details sirf confirm hone pe. Post order: account public rakhein + username change mat karna.

TRUST: Scam concern: 2022 se hai office bhi: https://share.google/LnMTo0SMbd5aF8n8V. Drop: lifetime refill. Safety: ban nahi hoga. Half payment acceptable.

Tone: Warm, brother/bhai. Forceful nahi guide karo.`;

async function callAI(sessionId, userMessage) {
  const data = loadData();
  if (!data[sessionId]) {
    data[sessionId] = { id: sessionId, startTime: new Date().toISOString(), lastActivity: new Date().toISOString(), messages: [], status: 'active', orderConfirmed: false, paymentReceived: false };
  }

  data[sessionId].messages.push({ role: 'user', content: userMessage, time: new Date().toISOString(), type: 'text' });
  data[sessionId].lastActivity = new Date().toISOString();

  const msgs = data[sessionId].messages;
  const history = msgs.slice(0, -1).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: userMessage }]
    })
  });

  if (!response.ok) { const err = await response.text(); throw new Error(`Groq ${response.status}: ${err}`); }

  const result = await response.json();
  const reply = result.choices?.[0]?.message?.content || 'Maafi, kuch masla hua.';

  if (reply.toLowerCase().includes('jazak allah') && reply.toLowerCase().includes('confirm')) { data[sessionId].orderConfirmed = true; data[sessionId].status = 'order_confirmed'; }
  if (reply.toLowerCase().includes('payment confirm')) { data[sessionId].paymentReceived = true; data[sessionId].status = 'payment_received'; }

  data[sessionId].messages.push({ role: 'assistant', content: reply, time: new Date().toISOString(), type: 'text' });
  saveData(data);
  return reply;
}

app.post('/api/session', (req, res) => {
  const sessionId = uuidv4();
  const data = loadData();
  data[sessionId] = { id: sessionId, startTime: new Date().toISOString(), lastActivity: new Date().toISOString(), messages: [], status: 'active', orderConfirmed: false, paymentReceived: false };
  saveData(data);
  res.json({ sessionId });
});

app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body;
  if (!sessionId || !message) return res.status(400).json({ error: 'Missing fields' });
  try { const reply = await callAI(sessionId, message); res.json({ reply }); }
  catch (err) { console.error('AI Error:', err.message); res.status(500).json({ error: err.message }); }
});

app.post('/api/screenshot', upload.single('screenshot'), async (req, res) => {
  const { sessionId } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const fileUrl = `/uploads/${req.file.filename}`;
  const data = loadData();
  if (data[sessionId]) {
    data[sessionId].messages.push({ role: 'user', content: 'Customer ne payment screenshot bheji', imageUrl: fileUrl, time: new Date().toISOString(), type: 'image' });
    data[sessionId].lastActivity = new Date().toISOString();
    data[sessionId].status = 'payment_screenshot_received';
    saveData(data);
  }
  try { const reply = await callAI(sessionId, 'Maine payment kar di hai screenshot bheja hai'); res.json({ reply, imageUrl: fileUrl }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) { res.json({ success: true, token: Buffer.from(ADMIN_PASSWORD).toString('base64') }); }
  else { res.status(401).json({ error: 'Wrong password' }); }
});

function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || Buffer.from(token, 'base64').toString() !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.get('/api/admin/conversations', adminAuth, (req, res) => {
  const data = loadData();
  res.json(Object.values(data).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity)));
});

app.get('/api/admin/conversations/:id', adminAuth, (req, res) => {
  const data = loadData();
  const conv = data[req.params.id];
  if (!conv) return res.status(404).json({ error: 'Not found' });
  res.json(conv);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Ali Baba Bot running on port ${PORT}`));
