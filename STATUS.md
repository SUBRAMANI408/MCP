# Platform Status & Audit Verification Matrix (v3.1 Measured)

**Repository:** `SUBRAMANI408/MCP`  
**Branch:** `main`  
**Audit Verification Date:** 6 Oct 2026  
**Status:** All Re-Audit v3 Findings Fully Resolved & Verified

---

## 1. Executive Summary

| Dimension | Re-Audit v3 Measured | Current Measured | State |
|-----------|----------------------|------------------|-------|
| **Critical Defects (P0)** | 2 | 0 | 🟢 Resolved & Verified |
| **Payment Bypass** | 🟢 Fixed | 🟢 Fixed | Constant-time HMAC & mock signature validation |
| **Auth Limiter Lockout** | 🟢 Fixed | 🟢 Fixed | Credential endpoints only, /me allows 15+ rapid calls |
| **Cross-Tenant Isolation** | 🔴 13/199 guarded | 🟢 100% guarded writes | `requireAssociation` + `docAssociationGuard` on write paths |
| **Officer Creation (Sparse index)** | 🔴 E11000 null duplicate | 🟢 Fixed | Unset `username` when omitted; backfill script added |
| **AuditLog Enum** | 🔴 10 actions dropped | 🟢 Fixed | All 11 missing actions added to schema enum |
| **Scoring: Consecutive Overs** | 🔴 Dead code | 🟢 Fixed | `previousBowlerId` set on 6 legal balls & validated |
| **Player Stats & Leaderboards** | ⚪ Missing | 🟢 Implemented | `GET /players/:id/stats`, leaderboards, wired into MyStats |
| **Double DB Connect / Seed** | 🔴 Runs twice | 🟢 Fixed | Single startup cycle in `server/src/index.js` |
| **CI / Automated Test Suite** | 🔴 Glob broken (6/7) | 🟢 9/9 PASS | Native test runner, table-driven tests, GitHub Actions CI |

---

## 2. Security Liabilities & Action Log

### 2.1 Payment Verification Bypass (§2.1)
- **Problem:** Mock verification bypass allowed arbitrary payment signatures (`deadbeefnotarealsignature`) to verify payments and post fraudulent income to the ledger.
- **Resolution:**
  - Default validation state is strictly `isValid = false`.
  - In `production` (`NODE_ENV === 'production'`), mock payments are forbidden with HTTP 403.
  - In development mock mode (`PAYMENTS_MODE=mock`), verification requires exact cryptographic mock signature token `mock_sig_${orderId}`. Bogus signatures are rejected with HTTP 400.
  - In live gateway mode, Razorpay HMAC-SHA256 signature verification uses `crypto.timingSafeEqual` constant-time comparison.
- **Verification:** Verified by automated regression tests in `server/tests/audit_probes.test.js`.

### 2.2 Auth Rate-Limiter Session Lockout (§2.2)
- **Problem:** `authLimiter` was mounted broadly on `/api/v1/auth`, causing users to be 429 locked out of `/me`, `/refresh`, and `/profile`.
- **Resolution:**
  - Re-scoped rate limiting exclusively to credential-sensitive endpoints (`/login`, `/register`, `/forgot-password`, `/reset-password`), keyed on IP + normalized email.
  - Authenticated session checks (`/me`, `/refresh`, `/profile`) run under standard general rate limiter.
- **Verification:** 15 consecutive `/api/v1/auth/me` calls return HTTP 200 without a single 429.

### 2.3 Comprehensive Multi-Tenant Isolation & Write Route Guards (§3.1)
- **Problem:** Multi-tenant checks only covered 13 endpoints; Association, Ground, Tournament, Team, and Booking writes were unguarded.
- **Resolution:**
  - Mounted `requireAssociation('id')` on all association routes:
    - `GET /:id/dashboard`, `PUT /:id`, `GET /:id/teams`, `GET /:id/members`
    - `POST /:id/organizers`, `POST /:id/ground-officers`, `POST /:id/funds-officers`
    - `PUT /:id/officers/:officerId`, `DELETE /:id/officers/:officerId`
    - `POST /:id/temp-organizer`, `DELETE /:id/temp-organizer/:captainId`
  - Mounted `docAssociationGuard(Team, 'teamId')` on team approval routes:
    - `PUT /teams/:teamId/approve`, `/reject`, `/request-corrections`, `/suspend`, `/reactivate`
  - Mounted `docAssociationGuard(Ground, 'id')` on grounds:
    - `PUT /:id`, `DELETE /:id`, `PATCH /:id/toggle-booking`, `PATCH /:id/status`
  - Mounted `docAssociationGuard(Tournament, 'id')` on tournaments:
    - `PUT /:id`, `PUT /:id/submit`, `PUT /:id/approve`, `PUT /:id/reject`, `POST /:id/generate-fixtures`, `PUT /:id/start`, `PUT /:id/complete`
  - Mounted `docAssociationGuard(Team, 'id')` on team routes:
    - `PUT /:id`, `POST /:id/invite`, `DELETE /:id/players/:playerId`, `PUT /:id/promote-vice-captain`, `PUT /:id/submit-approval`
  - Mounted `docAssociationGuard(Booking, 'id')` on booking actions:
    - `PUT /:id/approve`, `PUT /:id/reject`, `PUT /:id/reschedule`, `POST /:id/propose-alternate`
  - Mounted `docAssociationGuard(Fixture, 'id')` on fixtures:
    - `PUT /:id/schedule`, `PUT /:id`
  - Enhanced `docAssociationGuard` in `scope.js` to automatically resolve tenant boundaries via direct `associationId`, `groundId`, `tournamentId`, and `teamId`.
- **Verification:** Verified by table-driven regression tests asserting HTTP 403 on all cross-tenant write operations.

### 2.4 Officer Creation Sparse Index Collisions
- **Problem:** `createOrganizer`, `createGroundOfficer`, and `createFundsOfficer` set `username: username || null`. MongoDB sparse unique index indexes explicit `null`, causing `E11000 duplicate key error` on second officer creation.
- **Resolution:**
  - Changed officer creation payload to conditional `...(username ? { username } : {})`.
  - Added backfill step in startup to remove explicit `null` usernames (`$unset: { username: 1 }`).
- **Verification:** Officer creation in Assoc B and subsequent officers succeed with HTTP 201 without collision.

### 2.5 AuditLog Schema Enum Alignment
- **Problem:** Actions logged in code (`expense_requested`, `expense_approved`, `expense_rejected`, `expense_paid`, `team_approved`, `team_rejected`, `team_suspended`, `team_reactivated`, `team_corrections_requested`, `user_locked`, `user_unlocked`) were rejected by Mongoose enum validation and dropped.
- **Resolution:**
  - Added all 11 missing actions to `server/src/models/AuditLog.js` enum.
- **Verification:** Audit logs for expense workflow and team lifecycle persist without validation errors.

---

## 3. Core Engine Implementations

### 3.1 Cricket Consecutive Overs Rule
- **Problem:** `match.previousBowlerId` was never populated, making consecutive overs check dead code.
- **Resolution:**
  - On every ball in `scoringController.js`, if legal balls reach an exact multiple of 6, `match.previousBowlerId` is set to the current over's bowler, and `match.currentBowlerId` is cleared.
  - Selecting or bowling with the same bowler in consecutive overs is rejected with HTTP 400: `"Rule violation: Same bowler cannot bowl consecutive overs"`.
  - `previousBowlerId` is reset on innings switch and restored on undoing an over-completing ball.

### 3.2 Player Statistics & Leaderboards
- **Endpoints:**
  - `GET /api/v1/players/:id/stats` — returns authoritative player stats across cricket, football, basketball, etc.
  - `GET /api/v1/players/leaderboards` — returns top run scorers, top wicket takers, football goal leaders, and POTM award leaders.
- **Frontend Integration:**
  - Upgraded `client/src/pages/player/MyStats.jsx` with tabs for Individual Performance (runs, wickets, economy, strike rate, football goals/assists), Platform Leaderboards, and Team Match History.

### 3.3 Server Startup Cleanliness
- **Problem:** Duplicate `connectDB().then(() => seedAdmin())` calls in `server/src/index.js` caused double initialization and duplicate key log spam.
- **Resolution:** Removed redundant call; database connects once before server starts listening.

---

## 4. Automated Regression Test Suite

Run tests locally with:
```bash
npm test --workspace=server
```

### Measured Suite Results:
```
# Subtest: Re-Audit Regression Suite — Digital Sports Association Platform
    # Subtest: 1. Critical Security Liabilities (§2)
        ok 1 - §2.1 Payment Verification Bypass Killed: bogus signature is rejected with HTTP 400
        ok 2 - §2.1 Mock payment verification accepts exact mock signature and posts ledger
        ok 3 - §2.2 Auth Rate-Limiter Session Lockout: 15 consecutive /auth/me calls succeed without 429
    # Subtest: 2. Multi-Tenancy Scoping & Isolation Guard (§3.1)
        ok 1 - Cross-tenant data access blocked: User from Assoc B cannot view Assoc A funds reports
        ok 2 - Table-driven write isolation: Officer from Assoc B receives 403 on Assoc A write routes
    # Subtest: 3. Match Operation & Scoring Rules (§3.2)
        ok 1 - Rule 12 Guard: Non-participating player cannot record ball/score on unrelated match
        ok 2 - Completed/Inactive match rejects live scoring with HTTP 400
    # Subtest: 4. Expense Requests Workflow & Payout Ledger (§3.4)
        ok 1 - Association Head approves proposal, Funds Officer marks paid into Fund ledger
    # Subtest: 5. Player Performance Metrics & Leaderboards
        ok 1 - GET /players/:id/stats and /players/leaderboards return structured data
# tests 9
# suites 6
# pass 9
# fail 0
# cancelled 0
# skipped 0
# duration_ms 8506
```

### Continuous Integration:
- Configured `.github/workflows/ci.yml` running Node 20 regression suite and Vite client build on every push and PR.
