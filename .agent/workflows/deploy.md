---
description: Deploy changes to Railway production (update the platform)
---

# Deploy to Production

Follow these steps whenever the user says "update the platform", "deploy", or "push to live".

**IMPORTANT**: This workflow pushes the vetted code from Staging (`develop`) to the Live Production server (`main`). It should theoretically only be run after a task has been Approved on the DevOps Sync Board.

## 1. Build & Test Locally First

// turbo
```bash
cd server && npm run build 2>&1
```

If the build fails, fix the errors before proceeding.

// turbo
```bash
npm run build 2>&1
```

If the frontend build fails, fix the errors before proceeding.

## 2. Commit Changes to `develop` Branch

```bash
git add -A && git status
```

Review the staged files, then commit:

```bash
git commit -m "<descriptive commit message>"
```

## 3. Push Uncommitted Hotfixes to `develop` (Staging)

If the user made local hotfixes instead of using a Staging review cycle, push them to `develop` first so they aren't lost.

// turbo
```bash
git push origin develop 2>&1
```

## 4. Merge `develop` to `main` (Production Auto-Deploy)

```bash
git checkout main && git merge develop && git push origin main 2>&1
```

This triggers Railway auto-deploy. Wait ~60-90 seconds for the build.

## 5. Switch Back to `develop` for Continued Work

// turbo
```bash
git checkout develop
```

## 6. Verify Deployment

// turbo
```bash
Invoke-RestMethod -Uri "https://osia-production-6039.up.railway.app/health" -Method GET 2>&1
```

Should return `status: ok`. If it fails, wait 60s and try again (build may still be in progress).

## Rollback (If Something Breaks)

If the live site breaks after deploying:

```bash
git checkout main && git revert HEAD && git push origin main 2>&1
```

Then switch back to develop to fix:

// turbo
```bash
git checkout develop
```
