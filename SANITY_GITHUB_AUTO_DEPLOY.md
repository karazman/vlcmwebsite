# Sanity → GitHub Auto-Deploy Setup

Automatisches Deployment zu GitHub Pages wenn du einen Artikel in Sanity publishst.

## 📋 Übersicht

Es gibt 2 Wege, dies zu konfigurieren:

### **Option 1: Einfach (Empfohlen - kein Server nötig)**
Nutze eine Serverless-Funktion oder einen Automation-Service wie **n8n** oder **Zapier**

### **Option 2: Mit eigenem Server**
Deployed das Webhook-Script auf deinem Server (Railway, Render, Heroku, etc.)

---

## 🚀 Option 1: n8n oder Zapier (Serverless)

### Setup mit n8n (kostenlos, selbst-gehostet):

1. **n8n installieren** (Docker):
   ```bash
   docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n
   ```

2. **In n8n:**
   - Neuer Workflow
   - "Webhook" Trigger hinzufügen → Copy URL
   - "HTTP Request" Node hinzufügen mit:
     - URL: `https://api.github.com/repos/karazman/vlcmwebsite/dispatches`
     - Method: `POST`
     - Headers: `Authorization: Bearer [GITHUB_TOKEN]`
     - Body:
       ```json
       {
         "event_type": "sanity-publish",
         "client_payload": {
           "title": "{{ $node.Webhook.json.title }}",
           "document_id": "{{ $node.Webhook.json._id }}"
         }
       }
       ```

3. **In Sanity Studio:**
   - Gehe zu `https://manage.sanity.io/`
   - Wähle dein Projekt → Settings → Webhooks
   - Neuer Webhook:
     - Name: "GitHub Deploy"
     - URL: Deine n8n Webhook URL
     - Events: `Publish`, `Unpublish`
     - Document types: `post` (oder welche Dokumente publisht du?)

---

## 🔧 Option 2: Mit eigenem Server

### 1. GitHub Personal Access Token generieren

1. Gehe zu https://github.com/settings/tokens?type=beta
2. "Generate new token" → Fine-grained personal access token
3. Berechtigungen:
   - Repository access: `vlcmwebsite` repo select
   - Permissions: `Actions: Read and write`
4. Token kopieren und speichern

### 2. Webhook-Server deployen

**Auf Railway.app:**

```bash
# 1. Installiere Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Im Project-Root:
railway init  # Wähle "Node.js"

# 4. Setze Environment Variablen
railway variables set GITHUB_TOKEN "ghp_xxxxx"
railway variables set GITHUB_REPO "karazman/vlcmwebsite"
railway variables set SANITY_WEBHOOK_SECRET "dein-secret"

# 5. Deploy
railway up
```

**Alternative: Render.com**

```bash
# 1. Create new Web Service
# 2. Connect zu GitHub repo
# 3. Build command: npm install
# 4. Start command: node scripts/sanity-github-webhook.mjs
# 5. Add environment variables in Dashboard
```

### 3. Sanity Webhook konfigurieren

1. **Sanity CLI lokal:**
   ```bash
   npm install -g @sanity/cli
   sanity hook create
   ```

   Oder in https://manage.sanity.io/:
   - Projekt → Settings → Webhooks
   - New webhook:
     - Name: "GitHub Auto-Deploy"
     - URL: `https://[your-server]/webhook/sanity-publish` (z.B. `https://sanity-webhook-prod.up.railway.app/webhook/sanity-publish`)
     - Events: `Publish`
     - Document types: `post`
     - (Optional) Secret: speichern als `SANITY_WEBHOOK_SECRET`

---

## 🔐 Sicherheit

### Webhook Signature validieren (empfohlen):

1. **In Sanity:** Webhook-Edit → "Add hook secret"
2. **In deinem Server:** Die Signatur wird in `sanity-webhook-signature` Header gesendet und das Script validiert sie automatisch

---

## ✅ Testen

```bash
# Lokales Testen des Webhooks:
curl -X POST http://localhost:3000/webhook/sanity-publish \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "post.test-article",
    "title": "Test Article",
    "_type": "post"
  }'

# Sollte antworten mit:
# { "success": true, "message": "Deployment queued", ... }
```

---

## 🎯 Flow nach Setup:

1. Du publishst einen Artikel in Sanity Studio
2. Sanity sendet Webhook → GitHub Dispatch Event
3. GitHub Actions startet automatisch (`sanity-publish` trigger)
4. Hugo built die Seite neu
5. Sanity Studio wird gebuild
6. GitHub Pages wird updated
7. ~2 Min später: Deine Website zeigt den neuen Artikel

---

## 🚨 Troubleshooting

**Webhook wird nicht triggered?**
- Überprüfe in Sanity Webhooks "View deliveries" für Fehler
- Überprüfe GitHub Actions Log für `repository_dispatch` Events
- Stelle sicher GITHUB_TOKEN gültig ist

**"401 Unauthorized" Error?**
- GitHub Token ist falsch oder abgelaufen
- Überprüfe Token Permissions in https://github.com/settings/tokens

**Asset loading still fails?**
- Das ist ein separates Problem, wird parallel gelöst
- Webhook triggert trotzdem Deployment

---

## 📦 npm Dependencies für Webhook Server

Wenn du das Server-Script nutzest, installiere:

```bash
npm install express
```

Dann in `package.json` → `scripts`:
```json
"webhook": "node scripts/sanity-github-webhook.mjs"
```
