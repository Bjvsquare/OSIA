---
description: Deploy current branch features to the live Railway Staging Server
---

# Deploy to Staging Environment

Follow these steps whenever the user says "deploy to staging", "push to staging", or runs the `/deploy-staging` workflow command. 

This workflow is used when a feature is ready for the **"In Review"** column on the DevOps Sync Board.

## 1. Commit Local Feature Branch

Ask the user to write a descriptive commit message if they haven't provided one.

```bash
git add -A && git commit -m "<descriptive commit message>"
```

## 2. Push Feature and Merge to `develop`

The `develop` branch acts as our centralized Staging Environment code branch.

Switch to `develop`, merge the feature branch, and push it up to GitHub.

```bash
# Store the current feature branch name
CURRENT_BRANCH=$(git branch --show-current)

# Merge into develop
git checkout develop && git merge $CURRENT_BRANCH

# Push to origin (Triggers Railway Staging Build)
git push origin develop 2>&1
```

## 3. Verify Staging Health

Railway will automatically detect the push to `develop` and begin building the Staging service. Wait 60-90 seconds.

**IMPORTANT:** The URL you test here must be the Staging server URL, not the Production URL. 

Once the user creates the Railway Staging service, replace this placeholder URL with the actual Railway Staging URL:

// turbo
```bash
Invoke-RestMethod -Uri "https://osia-staging.up.railway.app/health" -Method GET 2>&1
```

*(Note to Agent: Instruct the user to update the healthcheck URI in this workflow file once their Staging server is created.)*

## 4. Final Instructions

Inform the user: "The code is now live on the Staging server! You can move your task to 'In Review' on the DevOps Sync Board and send the Staging URL to your reviewer."
