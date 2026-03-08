# Welcome to the OSIA Project, Misha!

Barend and his AI have established a **3-Tier Collaboration Pipeline** for the OSIA project. To ensure a perfect 1:1 setup on your machine without you needing to do any stressful manual configuration, we have designed this file to be fully autonomous.

### Misha's Instruction:
To get started, simply open Google Antigravity, open a new chat, paste the following prompt, and hit send. **Do not run any commands yourself; let the AI do the work.**

---
---

## 🤖 PROMPT FOR YOUR AI

**Copy everything below this line and paste it into your AI chat:**

> Hello Antigravity! I am Misha, joining Barend on the OSIA project. My goal is to get this repository running locally on my machine in a perfect 1:1 state, and to understand the dual-developer workflow you have established.
> 
> Please read the instructions below and **execute them autonomously** on my behalf.
> 
> ### Phase 1: Environment Setup
> 1. Use the `view_file` tool to read the `COLLABORATOR_SETUP.md` document in the root directory. Pay special attention to "Section 9: AI Agent Directives".
> 2. Create the `.env` root file and the `server/.env` file. Do not run any servers yet; instead, ask me (Misha) to provide you with the missing API keys (Supabase, Google, Stripe, etc.) to populate these files. 
> 3. Once I provide the keys, write them into the `.env` files.
> 4. Run `npm install` in the root directory, and `cd server && npm install` in the server directory.
>
> ### Phase 2: Workflow Activation
> 1. Start the frontend developer server and backend developer server concurrently.
> 2. Verify both are running correctly.
>
> ### Phase 3: Project Synchronization
> 1. Read through the `.agent/workflows/deploy.md` and `.agent/workflows/deploy-staging.md` files so you understand the multi-tiered pipeline Barend established.
> 2. Explain to me in exactly 3 simple sentences how the **DevOps Sync Board** located at `http://localhost:5173/admin` maps to GitHub branches (`feature` vs `develop` vs `main`).
> 3. Explain to me how we will handle Merge Conflicts if Barend and I accidentally code at the same time.
> 
> Once all steps are complete, inform me that the OSIA local environment is fully operational and ask me what Focus Point I would like to tackle first!
