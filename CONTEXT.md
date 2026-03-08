# OSIA — Collaboration Context

> **Keep this file updated.**  
> Before starting work, pull latest and check this file to avoid overlapping with your teammate.

## Project Overview

OSIA is a personal-development SaaS platform built with:

| Layer     | Tech                              |
|-----------|-----------------------------------|
| Frontend  | React + Vite + TypeScript + Tailwind CSS |
| Backend   | Express.js (TypeScript)           |
| Database  | Supabase (Postgres) + Neo4j       |
| Auth      | Google OAuth 2.0                  |
| AI        | OpenAI + Anthropic Claude         |
| Payments  | Stripe                            |
| Hosting   | Railway (auto-deploys from `main`) |

## Branch Strategy

```
main      ← production (Railway auto-deploys from here)
develop   ← integration branch (day-to-day work)
feature/* ← individual feature branches
```

### Branch Naming Convention

```
feature/<your-name>-<short-description>
```

Examples:
- `feature/barend-dashboard-redesign`
- `feature/teammate-onboarding-flow`

## Active Assignments

<!-- Update this table when you start/finish a feature -->

| Developer | Branch | Working On | Status |
|-----------|--------|------------|--------|
| Barend    | `develop` | General development | Active |
| _TBD_     | —      | —          | Setting up |

## Rules to Avoid Conflicts

1. **Never work directly on `main`** — it's production-only.
2. **Always pull before starting work**: `git pull origin develop`
3. **Use feature branches** for any non-trivial change.
4. **Update this file** when you start a new feature so your teammate knows.
5. **Communicate before touching shared files** like `package.json`, `vite.config.ts`, `tailwind.config.js`, or core layout components.
6. **Set Antigravity review policy to "request review"** so the AI shows changes before saving.

## Key Directories

```
sentari-app/
├── src/              # Frontend React code
│   ├── components/   # Reusable UI components
│   ├── pages/        # Route pages
│   ├── stores/       # Zustand state stores
│   └── styles/       # CSS / Tailwind
├── server/           # Express backend
│   ├── routes/       # API route handlers
│   ├── services/     # Business logic
│   └── middleware/    # Auth, logging, etc.
├── public/           # Static assets
└── docs/             # Documentation
```
