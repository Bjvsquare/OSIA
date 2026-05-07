# OSIA MVP Security Migration Guide

## Overview

This migration prepares the OSIA platform for the visual-first MVP by fixing critical security issues and establishing a clean foundation.

**Timeline:** 2-3 hours  
**Risk Level:** LOW (backward compatible, all existing routes still work)

## Pre-Migration Checklist

- [ ] All team members have latest branch pulled
- [ ] Database backups completed
- [ ] CI/CD pipeline disabled (if auto-deploying)
- [ ] Environment variables reviewed

## Migration Steps

### 1. **Database Migration (Supabase)**

```bash
# 1a. Get Supabase CLI
npm install -g supabase

# 1b. Push the new migration to Supabase
supabase migration up

# OR if using SQL Client (pgAdmin, DBeaver):
# Copy the SQL from db/migrations/001_add_checkins_and_patterns.sql
# Execute directly in your Supabase database console
```

**What this does:**
- Creates `public.check_ins` table with proper RLS policies
- Creates `public.patterns` table for detected patterns
- Adds indexes for performance
- Sets up auto-updated `updated_at` triggers

**Verify success:**
```sql
-- In Supabase SQL editor
SELECT * FROM information_schema.tables WHERE table_name = 'check_ins';
-- Should return 1 row
```

### 2. **Environment Variables**

No changes needed. Existing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are used.

**Check:**
```bash
# In server/.env, verify these exist:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-key>
```

### 3. **Test New Endpoints**

```bash
# Start server
npm run dev:backend

# In another terminal, test the check-in endpoint:
curl -X POST http://localhost:3001/api/check-ins/quick \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "emotion": "Energized",
    "energy_level": 75,
    "context": "Finished MVP implementation"
  }'

# Expected response:
{
  "success": true,
  "data": {
    "id": "uuid...",
    "user_id": "uuid...",
    "emotion": "Energized",
    "energy_level": 75,
    "context": "Finished MVP implementation",
    "created_at": "2026-05-07T...",
    "updated_at": "2026-05-07T..."
  },
  "message": "Check-in saved successfully"
}
```

### 4. **Verify Security Features**

#### 4a. Rate Limiting (Auth)

```bash
# Try logging in more than 5 times in 15 minutes
# 6th attempt should fail with 429:
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Should see:
# HTTP 429
# "Too many auth attempts, please try again later"
```

#### 4b. Input Validation

```bash
# Try invalid emotion:
curl -X POST http://localhost:3001/api/check-ins/quick \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "emotion": "InvalidEmotion",
    "energy_level": 75
  }'

# Should see:
# HTTP 400
# "Validation error" with details
```

#### 4c. Structured Logging

```bash
# Check logs directory
ls -la logs/

# Should see:
# - logs/app.log (request logs)
# - logs/audit.log (security events, auth attempts)

# Verify no passwords in audit log:
grep -i password logs/audit.log
# Should return nothing
```

### 5. **Clean Up Old Code**

**Files that are now deprecated** (keep for now, remove later):

- `server/src/db.ts` — Old file-based DB (now using Supabase)
- `server/src/routes/connectRoutes.ts` — Has Windows hardcoded paths (TODO: fix)
- Scattered `console.log()` calls throughout routes

**What NOT to delete yet:**
- Auth routes, user routes, team routes (still used)
- Neo4j service (still used for graphs)
- All existing data (no deletions)

## Rollback Plan

If something breaks:

```bash
# 1. Revert server changes
git revert HEAD

# 2. Undo Supabase migration
supabase migration down

# 3. Restart server
npm run dev:backend
```

## Verification Checklist

- [ ] Server starts without errors: `npm run dev:backend`
- [ ] Health endpoint works: `curl http://localhost:3001/health`
- [ ] Check-in POST works with valid data
- [ ] Check-in POST fails gracefully with invalid data
- [ ] Rate limiting blocks 6th auth attempt
- [ ] Logs don't contain passwords/tokens
- [ ] Existing auth routes still work
- [ ] Existing user routes still work

## What's Next

After this migration, you're ready for:

1. **Frontend Visual MVP**
   - EmotionOrbPicker component
   - EnergySlider component
   - VisualCheckInPage

2. **Pattern Detection Service** (async)
   - Analyze check-in data
   - Detect emerging patterns
   - Run nightly or on every 3rd check-in

3. **Frontend Dashboard**
   - Show check-in count
   - Show emerging patterns
   - Show journey timeline

## Troubleshooting

### Issue: Supabase migration fails

**Solution:**
```bash
# Check migration status
supabase migration list

# If stuck, manually run SQL in Supabase console
# Copy from db/migrations/001_add_checkins_and_patterns.sql
```

### Issue: Rate limiting not working

**Check:**
```bash
# Verify express-rate-limit is installed
npm list express-rate-limit

# If missing:
npm install express-rate-limit
```

### Issue: Zod validation errors are unclear

**Check:**
```bash
# Test schema directly in Node:
node
const { CheckInSchema } = require('./server/src/validators/checkIn');
CheckInSchema.parse({ emotion: 'BadEmotion', energy_level: 75 });
// Will show detailed validation error
```

### Issue: Logger not creating files

**Solution:**
```bash
# Ensure logs directory exists
mkdir -p logs

# Check permissions
ls -la logs/
# Should be readable/writable
```

## Questions?

- **Did we break something?** → Check the server logs in `logs/app.log`
- **New endpoint not working?** → Verify the JWT token is valid
- **Performance issues?** → Check Supabase query performance in dashboard

## Summary

✅ Database migrated to Supabase  
✅ Inputs validated with Zod  
✅ Logging secured (no passwords)  
✅ Rate limiting enabled  
✅ Check-in service created  

**Status:** Ready for visual MVP development!
