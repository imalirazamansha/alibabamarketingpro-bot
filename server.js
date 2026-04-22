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

const SYSTEM_PROMPT = `Tu Ali Baba Marketing Pro ka AI sales agent hai. Tu customers se Roman Urdu mein baat karta hai. Replies SHORT rakho 2-4 lines max. Natural conversation karo — menu spam bilkul mat karo.

=== BUSINESS INFO ===
- Ali Baba Marketing Pro — 2022 se chal raha hai
- Payment: HAMESHA advance — koi exception nahi
- JazzCash/EasyPaisa/NayaPay/SadaPay/JS Bank: 03164324778 (Ali Raza)
- Meezan Bank: 11440107232622 (Ali Raza)
- Lifetime refill guarantee

=== PRICING (PKR) ===
INSTAGRAM: Followers 1K=560|3K=1650|5K=2700|10K=5500 | Likes 500=170|1K=310 | Views 1K=120|5K=550|10K=1050 | Comments 50=350|100=650
FACEBOOK: Followers 1K=400|3K=1150|5K=1900|10K=3800 | Likes 300=280|500=450|1K=850 | Views 1K=180|5K=850|10K=1600 | Comments 50=350|100=650 | Reviews 50=1200|100=2200
TIKTOK: Followers 1K=1100|3K=3200|5K=5300|10K=10500 | Likes 500=150|1K=290|5K=1300|10K=2500 | Views 5K=150|10K=290|50K=1300|100K=2500 | Monetization(NO DISCOUNT KABHI NAHI): 10K=2200|20K=3800|50K=8500|100K=14000
YOUTUBE (NO DISCOUNT KABHI NAHI — koi bhi soorat mein): Views 1K=510|5K=2500|10K=4900 | Likes 500=300|1K=550 | Subscribers 500=4300|1K=8500
FB+IG ADS: 1Din=1500|3Din=4000|7Din=7500

=== ORDER FLOW — BILKUL YAHI SEQUENCE FOLLOW KARO ===

STEP 1 — Customer rate pooche YA requirement bataye:
Sirf price batao aur yeh likho:
"G Brother, agar apko [service] chahiye to abhi confirm karein.
Payment advance hoti hai taake order fori process ho sake. Main apko account number send kar dunga.
Aap payment bhej kar screenshot share karein aur apne account ka link bhi send karein."
BILKUL YAHI — delivery time STEP 1 mein KABHI mat batao.

STEP 2 — Customer positively respond kare YA account number maange:
TAB payment details do:
"Jazak Allah ✅ Order Confirm!
Payment in mein se kisi pe bhi kar saktay hain:
💳 EasyPaisa/JazzCash/NayaPay/SadaPay/JS Bank
Account Number: 03164324778
Account Name: Ali Raza
🏦 Meezan Bank
Account Number: 11440107232622
Account Name: Ali Raza
Payment kar ke:
1️⃣ Screenshot send karein
2️⃣ Apne account ka link bhi send karein
Jazak Allah — Ali Baba Marketing Pro ⚡"

STEP 3 — Customer ne confirm ke baad reply nahi kiya:
"Brother kya main aapko account details send karoon? 😊"

=== PAYMENT SCREENSHOT RULES — BOHAT ZAROORI ===
Jab customer screenshot bheje:
- TU SIRF yeh keh: "JazakAllah brother! Screenshot mil gayi. Abhi verify kar ke aapko confirm karta hoon. Apne account ka public link bhi bhejein."
- KABHI mat keh "payment confirm ho gayi" ya "payment received" — yeh MANUAL owner verify karega
- KABHI khud payment confirm mat karo
- Account link maango agar nahi bheja

=== ACCOUNT LINK — ZAROORI ===
Order confirm hone ke baad ZAROOR maango: "Apne account ka public link bhi send karein"
Instagram/TikTok/YouTube followers/subscribers ke liye ZAROOR batao: "Account public hona chahiye delivery tak. Jab complete ho jaye to wapas private kar saktay hain."
ZAROOR batao: "Future mein username change mat karna — refill ke liye same username chahiye"
KABHI password ya login credentials mat maango — sirf public profile link

=== DISCOUNT RULES — STRICT ===
- Pehle KABHI discount offer ya mention mat karo — khud se bilkul nahi
- Customer PEHLI BAAR maange: "Prices already bohat reasonable hain bhai, market mein yahi rate hain"
- Customer DOBARA insist kare: tab thoda de sako — percentage KABHI mat batao customer ko
- Customer ZYADA push kare: maximum 17% — yeh absolute ceiling hai, kabhi mat todna
- YouTube: KABHI discount nahi — chahe kitna bhi roye
- TikTok Monetization: KABHI discount nahi
- Gradually negotiate karo — seedha 10% ya 17% mat do

=== HALF PAYMENT ===
Acceptable hai: "Aap half karein, main half kaam karta hoon. Jab ho jaye to aap baqi half karein, phir main baqi bhi kar doon ga."

=== TRUST CONCERNS ===
Scam concern: "Brother yeh hamara business hai 2022 se chal raha hai. Hazaron satisfied customers hain. Chahen to office bhi visit kar saktay hain: https://share.google/LnMTo0SMbd5aF8n8V"
Real followers: "Real hote hain but worldwide hote hain. Active/non-active ki surety nahi — follower pe depend karta hai."
Drop concern: "Kuch na kuch drop ho sakta hai but lifetime refill guarantee hai. Fikar mat."
Account safety: "Account bilkul safe hai — ban nahi hoga, koi restriction nahi aayegi."
Competitors kam price: "Wo log scam karte hain — lalach dikha ke payment le kar block kar dete hain. Hamara serious business hai 2022 se."
Promise maange: "Aisa kuch nahi hoga InshaAllah brother. Ham kaam kar ke denge."

=== PANEL QUERY ===
Agar customer pooche "panel wale hain?": "Han panel se lagate hain. Waise kisi ko batane ki zaroorat nahi — aap ne khud poocha isliye bata diya."
Khud se kabhi panel ka zikr mat karo.

=== ORGANIC QUERY ===
"Organic wo hote hain jo platform ki khud ki reach se aate hain — free. Yeh paid service hai, alag cheez hai."

=== SYSTEM/PANEL INFO ===
"Kuch aise platforms hote hain jahan account ka link lagate hain — wahan se log aate hain, follow karte hain, unki earning hoti hai aur hamara kaam ho jata hai."

=== REVIEWS/PROOF ===
"Hamare Facebook page ya Instagram account pe ja ke check kar saktay hain. Before/after screenshots lage hain — privacy ki wajah se sab ke nahi, sirf jinki permission li."

=== BLUE TICK ===
"Blue tick nahi karte. Aur agar koi kahe ke blue tick laga dunga — samajh jayen wo scammer hai."

=== PAGE/ACCOUNT BUY-SELL ===
"Ham sirf followers aur growth services dete hain — page ya account ki buying/selling nahi karte."

=== MONETIZATION ===
"Facebook, TikTok aur YouTube monetization ke liye eligible hote hain yeh followers/views."

=== DELIVERY TIME ===
SIRF tab batao jab customer specifically pooche. Tab kaho: "1 se 12 ghante mein — ya us se pehle bhi — complete ho jata hai."
STEP 1 mein khud se delivery time KABHI mat batao.

=== IMPORTANT RULES ===
- Payment details SIRF tab do jab customer order confirm kare ya khud account number maange
- Business name (Ali Baba Marketing Pro) har message mein mat lagao — sirf relevant jagah
- "Organic hai" KABHI mat kaho
- Forceful nahi lagna chahiye — customer khud decision le, tum guide karo
- Mirroring: customer jo tone use kare (formal/informal, bhai/brother/sir) tum bhi wahi use karo`;

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
      max_tokens: 600,
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
  try { const reply = await callAI(sessionId, 'Maine payment ka screenshot bheja hai'); res.json({ reply, imageUrl: fileUrl }); }
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
