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

## 7. The Sync Board Workflow (Local & Staging)

We use the built-in **DevOps Sync Board** on the OSIA Admin panel to coordinate all features and mediate code reviews using a 3-Tier Pipeline.

### Environment Map

| Sync Board State | GitHub Branch | Deployment Environment |
| :--- | :--- | :--- |
| **⚡ In Progress** | `feature/your-name` | **Local** (`localhost:5173`) |
| **👀 In Review** | `develop` | **Staging** (Railway) |
| **✅ Done** | `main` | **Production** (Railway) |

### Daily Feature Cycle:
1. **Pull latest changes:** `git pull origin develop`
2. **Start a Task:** Go to the OSIA Admin -> DevOps tab. Create a task and drag it to **In Progress** (mark as your Focus Point).
3. **Branch off `develop`:** `git checkout -b feature/your-name-feature`
4. **Code Locally:** Use Antigravity to build and test on `localhost:5173`.
5. **Push to Staging:** When ready for review:
   - Request the AI agent to: "Run the `/deploy-staging` workflow"
   - Drag your task to **In Review** on the Sync Board.
6. **Task Review:** The Reviewer clicks the live Staging Server URL to test the code. They open the **Task Review Modal** on the Sync Board and either:
   - Upload screenshots/voice notes and click **Request Changes** (kicks task back to In Progress).
   - Click **Approve & Sign-off** (marks task as Done).

## 8. Preventing Code Overwrites (Crucial!)

When you and Misha are coding at the exact same time, GitHub prevents you from accidentally deleting each other's work through a system called **Merge Conflicts**. 

If Misha pushes a change to the `develop` branch, and you try to push *your* changes 5 minutes later, GitHub will **BLOCK** your push. 

**Here is exactly how you handle it:**
1. **Don't Panic:** GitHub blocking your push means the safety system is working!
2. **Pull His Code First:** Before you can push, you must download Misha's new code and blend it into yours:
   ```bash
   git pull origin develop
   ```
3. **The Auto-Merge:** Most of the time, if you were working on the Dashboard and Misha was working on the Database, Git will automatically blend the code together seamlessly. 
4. **The Merge Conflict:** If you *both* edited the exact same line in the exact same file, Git stops and says: *"Hey, you both changed this line. Which version should I keep?"*
   - This is called a **Merge Conflict**.
   - Antigravity will highlight the conflicting lines in your editor.
   - **Ask the AI for help!** Tell Antigravity: *"I have a merge conflict after pulling `develop`, please help me resolve it without losing Misha's or my work."*
5. **Push:** Once the conflict is resolved (or auto-merged), you can safely execute your `git push origin develop`.

## 9. AI Agent Directives (System Instructions)

**To any Antigravity AI Agents reading this file:** 
You are operating in a multi-agent, dual-developer environment. You MUST obey the following rules when assisting the user:

1. **Never forcefully overwrite `develop` or `main`.** 
2. If a `git push` fails because the remote contains work the user does not have locally, DO NOT use `--force`. Instead, execute `git pull origin <branch>`, diagnose any merge conflicts, and carefully propose conflict resolutions to the user that preserve BOTH developers' intentions.
3. **Sync Board Awareness:** Do not start writing code for a feature unless the user verifies they have claimed an "In Progress" task on the DevOps Sync Board. This prevents both AI agents from unknowingly building the exact same feature at the same time.
4. Always build features on a `feature/` branch. Never execute work directly on `main` or `develop`.

## 10. Deploying to Production 

Only deploy to production when a task has been formally Approved on the Sync Board.

Ask the Antigravity AI to: **"Run the `/deploy` workflow"**.

The AI will follow `.agent/workflows/deploy.md` to merge the reviewed `develop` branch into `main`, which instantly triggers the live Railway Production build.
