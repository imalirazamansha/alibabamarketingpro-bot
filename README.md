# Ali Baba Marketing Pro — AI Chatbot

## Files:
- `server.js` — Backend (Node.js)
- `public/index.html` — Customer chat page
- `public/admin.html` — Aapka admin panel
- `render.yaml` — Render.com deployment config

---

## Render.com pe Deploy karo (FREE):

### Step 1 — GitHub pe upload karo
1. github.com pe jaao — free account banao
2. New Repository banao: "alibaba-bot"
3. Yeh saari files upload karo

### Step 2 — Render.com pe deploy karo
1. render.com pe jaao — free account banao
2. "New Web Service" click karo
3. GitHub repo connect karo
4. Environment Variables add karo:
   - `GEMINI_API_KEY` = aapki Google Gemini API key
   - `ADMIN_PASSWORD` = apna password (jo aap yaad rakh sako)
5. Deploy click karo — 2-3 minute mein live ho jayega

### Step 3 — Links
- Customer chat: `https://aapka-app.onrender.com`
- Admin panel: `https://aapka-app.onrender.com/admin.html`

---

## Ads mein use karo:
- Facebook/Instagram ad mein customer chat link daal do
- Customer click kare → chat shuru → aap admin panel mein dekho

## Admin Panel:
- `/admin.html` pe jaao
- Password daalo (jo aapne set kiya)
- Sab conversations real-time mein dikhengi
- Har 15 second mein auto-refresh hoti hai
