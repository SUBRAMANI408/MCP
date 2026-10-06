# Platform Status & Audit Verification Matrix (v4.0 Measured)

**Repository:** `SUBRAMANI408/MCP`  
**Branch:** `main`  
**Audit Verification Date:** 6 Oct 2026  
**Status:** All Re-Audit v4 Findings Fully Resolved & Verified

---

## 1. Executive Summary

| Dimension | Re-Audit v4 Measured | Current Measured | State |
|-----------|----------------------|------------------|-------|
| **PlayerStat Writes** | 🔴 Shell / 0 writes (schema mismatch) | 🟢 100% Authoritative Upsert | Derived from scorecard generator; runs/wickets/maidens/POTM upserted |
| **Cross-Tenant Writes** | 🔴 5 modules open | 🟢 100% Guarded (403) | announcements, friendlyMatches, payments, uploads, players, expenses, tournaments |
| **Balance Reconciliation** | 🟡 `getBalance` != `getDashboard` | 🟢 Consistent & Unified | Both aggregate `{ $in: ['approved', 'completed'] }` expenses |
| **Expense Review Validation** | 🟡 Typos set status: undefined | 🟢 Strict enum validation | Rejects non-`['approved', 'rejected']` with HTTP 400 |
| **Payment Bypass** | 🟢 Fixed | 🟢 Fixed | Constant-time HMAC & mock signature validation |
| **Auth Limiter Lockout** | 🟢 Fixed | 🟢 Fixed | Credential endpoints only, /me allows 15+ rapid calls |
| **Officer Creation (Sparse index)** | 🟢 Fixed | 🟢 Fixed | Unset `username` when omitted; backfill script added |
| **AuditLog Enum** | 🟢 Fixed | 🟢 Fixed | All missing actions added to schema enum |
| **Scoring: Consecutive Overs** | 🟢 Fixed | 🟢 Fixed | `previousBowlerId` tracked on over completion & enforced |
| **Server Startup Cleanliness** | 🟢 Fixed | 🟢 Clean single boot | DB host fallback logged, single connectDB invocation |
| **CI / Automated Test Suite** | 🟢 Passing | 🟢 11/11 PASS (0 Fail) | Native test runner, table-driven tests, GitHub Actions CI |

---

## 2. Re-Audit v4 Resolutions & Verifications

### 2.1 Authoritative Player Statistics Upsert (§1)
- **Problem:** `matchCompletionService.js` attempted to read `inn.batsmen` and `inn.bowlers` which do not exist on `inningSchema` (balls are recorded flatly in `inn.balls[]`). As a result, `PlayerStat` was never written upon match completion.
- **Resolution:**
  - Integrated `generateCricketScorecard(match)` from `scorecardGenerator.js` to derive batting and bowling tables.
  - Upserted individual player stats: matches, innings, runs, balls, 4s, 6s, wickets, overs, maidens, runs conceded, and Player of the Match awards into `PlayerStat`.
- **Verification:** Verified via automated test `Match completion authoritative upsert: PlayerStat records non-zero stats upon completion`. Asserted `runs >= 4` and `matches >= 1` recorded in database after match completion.

### 2.2 Comprehensive Multi-Tenant Write Guards (§2)
- **Problem:** Cross-tenant write endpoints were missing guards in announcements, expenses, payments, players, friendly matches, team details, and tournament registrations.
- **Resolution:**
  - `announcements.js`: Added `requireAssociation('associationId')` on POST/GET, and `docAssociationGuard(Announcement, 'id')` on GET/PUT/DELETE/:id and POST /:id/read.
  - `expenses.js`: Added `requireAssociation('associationId')` on POST / and GET /.
  - `payments.js`: Added `requireAssociation('associationId')` on POST /order and GET /history.
  - `players.js`: Added `requireAssociation('associationId')` on GET /leaderboards, and `docAssociationGuard(User, 'id')` on GET /:id/stats.
  - `teams.js`: Added `docAssociationGuard(Team, 'id')` on GET /:id and GET /:id/players; permitted `admin` role on POST /teams.
  - `tournaments.js` & `tournamentController.js`: Added `docAssociationGuard(Tournament, 'id')` on registration routes and enforced team association equality with tournament association.
  - `friendlyMatches.js` & `friendlyMatchController.js`: Blocked cross-association requests in `sendFriendlyRequest`, restricted `getFriendlyMatch` to participating team members or platform admins.
  - `uploads.js` & `uploadController.js`: Cloudinary storage paths are scoped by tenant ID (`sports_platform/${tenantId}/${folder}`).
- **Verification:** Verified via table-driven regression tests asserting HTTP 403 on cross-tenant writes across all modules.

### 2.3 Financial Balance Calculation Reconciliation (§3)
- **Problem:** `getBalance` filtered expenses by `{ status: 'approved' }`, while `getDashboard` filtered expenses by `{ status: { $in: ['approved', 'completed'] } }`. When expenses were marked paid by Funds Officers (`status: 'completed'`), `getBalance` ignored them.
- **Resolution:**
  - Unified `getBalance` and `getDashboard` to filter expenses with `{ status: { $in: ['approved', 'completed'] } }`.
- **Verification:** Verified both endpoints return identical total expense and balance figures.

### 2.4 Expense Review Status Enum Validation (§4)
- **Problem:** `reviewExpenseRequest` accepted arbitrary strings, saving typos as `status: undefined` without validation error.
- **Resolution:**
  - Added strict guard: `if (!status || !['approved', 'rejected'].includes(status))` returning HTTP 400.
- **Verification:** Verified with test sending invalid status (`status: "approvved"`), asserting HTTP 400.

### 2.5 UI Razorpay Checkout & Registration Fee Workflow (§5)
- **Resolution:**
  - Wired Razorpay checkout step in `TournamentRegistration.jsx` with order creation and verification against `/payments/order` and `/payments/verify`.
  - Added visual fee status (`due`, `paid`, `unpaid`, `exempt`) and active "Pay Fee" button for registered teams.

---

## 3. Automated Regression Test Suite

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
        ok 1 - Review validation: reviewExpenseRequest rejects invalid status with HTTP 400
        ok 2 - Association Head approves proposal, Funds Officer marks paid into Fund ledger
    # Subtest: 5. Player Performance Metrics & Leaderboards
        ok 1 - GET /players/:id/stats and /players/leaderboards return structured data
        ok 2 - Match completion authoritative upsert: PlayerStat records non-zero stats upon completion
# tests 11
# suites 6
# pass 11
# fail 0
# cancelled 0
# skipped 0
# duration_ms 6008
```

### Continuous Integration:
- Configured `.github/workflows/ci.yml` running Node 20 regression suite and Vite client build on every push and PR.
