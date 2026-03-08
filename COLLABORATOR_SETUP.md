# OSIA — New Collaborator Setup Guide

Follow these steps to get the project running on your machine with Antigravity.

---

## 1. Accept the GitHub Invite

Barend will send you a collaborator invite to [Bjvsquare/OSIA](https://github.com/Bjvsquare/OSIA). Accept it from your GitHub notifications or email.

## 2. Clone the Repository

```bash
git clone https://github.com/Bjvsquare/OSIA.git
cd OSIA
```

## 3. Open in Antigravity

1. Open **Google Antigravity** (the AI IDE).
2. Click **File → Open Folder** and select the cloned `OSIA` folder.
3. **Set review policy**: Go to the bottom-right corner → **Antigravity Settings** → set **Review Policy** to **"Request Review"**.  
   _This forces the AI to show you proposed code changes before saving — critical when two people are collaborating._

## 4. Set Up Environment Variables

### Frontend (root `.env`)

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```
VITE_GOOGLE_CLIENT_ID=<ask Barend>
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=<ask Barend>
VITE_SUPABASE_ANON_KEY=<ask Barend>
```

### Backend (`server/.env`)

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and fill in all values. Ask Barend for the keys you need:

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET`
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
- `NEO4J_URI` / `NEO4J_USER` / `NEO4J_PASSWORD`
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`

> ⚠️ **Never commit `.env` files.** They are already in `.gitignore`.

## 5. Install Dependencies

```bash
npm install
cd server && npm install && cd ..
```

## 6. Run Locally

Start both frontend and backend:

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
npm run dev
```

The app will be available at `http://localhost:5173` with the API at `http://localhost:3001`.

## 7. Daily Workflow

```bash
# 1. Pull latest changes
git pull origin develop

# 2. Create your feature branch
git checkout -b feature/your-name-description

# 3. Work in Antigravity (the AI agent will propose changes)

# 4. Commit when done
git add .
git commit -m "feat: description of what you built"

# 5. Push your branch
git push origin feature/your-name-description

# 6. Open a Pull Request on GitHub
#    Base: develop ← Compare: feature/your-name-description
```

## 8. Important Rules

- **Never push directly to `main`** — it auto-deploys to production on Railway.
- **Always branch off `develop`**, not `main`.
- **Update `CONTEXT.md`** when you start a new feature so Barend knows what you're working on.
- **Pull before branching** to avoid merge conflicts.
- If you get merge conflicts, resolve them in Antigravity — you can ask the AI agent to help explain the conflicting code.

## 9. Deploying (Coordinated)

Only merge to `main` when both team members agree. See `.agent/workflows/deploy.md` for the full deploy process. In general:

1. Merge your feature branch → `develop` via PR
2. Coordinate with Barend
3. Merge `develop` → `main` to trigger Railway deploy
