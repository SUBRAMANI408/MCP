const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/v1';

let adminToken = '';
let playerToken = '';
let assocAId = '';
let assocBId = '';

async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data };
}

describe('Re-Audit Regression Suite — Digital Sports Association Platform', () => {

  before(async () => {
    // 1. Authenticate admin
    const adminLogin = await apiRequest('/auth/login', 'POST', {
      email: 'admin@sports.com',
      password: 'password123',
    });
    assert.equal(adminLogin.status, 200, 'Admin login must succeed');
    adminToken = adminLogin.data.data.token;

    // 2. Fetch or create associations for tenant testing
    const assocs = await apiRequest('/associations', 'GET', null, adminToken);
    if (assocs.data?.data?.length >= 2) {
      assocAId = assocs.data.data[0]._id;
      assocBId = assocs.data.data[1]._id;
    } else {
      const stamp = Date.now();
      const newAssocA = await apiRequest('/admin/associations', 'POST', {
        name: `Alpha District Sports ${stamp}`,
        headName: 'Head Alpha',
        headEmail: `head.alpha.${stamp}@sports.com`,
        headPassword: 'password123',
        address: 'Metropolis',
      }, adminToken);

      const newAssocB = await apiRequest('/admin/associations', 'POST', {
        name: `Beta County Sports ${stamp}`,
        headName: 'Head Beta',
        headEmail: `head.beta.${stamp}@sports.com`,
        headPassword: 'password123',
        address: 'Gotham',
      }, adminToken);

      assocAId = newAssocA.data?.data?._id || newAssocA.data?.data?.association?._id || newAssocA.data?._id;
      assocBId = newAssocB.data?.data?._id || newAssocB.data?.data?.association?._id || newAssocB.data?._id;
    }

    // 3. Authenticate regular player
    const playerLogin = await apiRequest('/auth/login', 'POST', {
      email: 'player@sports.com',
      password: 'password123',
    });
    if (playerLogin.status === 200) {
      playerToken = playerLogin.data.data.token;
    }
  });

  describe('1. Critical Security Liabilities (§2)', () => {
    test('§2.1 Payment Verification Bypass Killed: bogus signature is rejected with HTTP 400', async () => {
      const orderRes = await apiRequest('/payments/order', 'POST', {
        amount: 2500,
        currency: 'INR',
        purpose: 'tournament_fee',
        associationId: assocAId,
      }, adminToken);

      assert.equal(orderRes.status, 201, 'Order creation must succeed');
      const orderId = orderRes.data.data.orderId;

      // Probe with forged bogus signature
      const probeBogus = await apiRequest('/payments/verify', 'POST', {
        orderId,
        paymentId: 'pay_probe_test_123',
        signature: 'deadbeefnotarealsignature',
      }, adminToken);

      assert.equal(probeBogus.status, 400, 'Bogus signature MUST return HTTP 400 rejection');
      assert.equal(probeBogus.data.success, false, 'success must be false');
    });

    test('§2.1 Mock payment verification accepts exact mock signature and posts ledger', async () => {
      const orderRes = await apiRequest('/payments/order', 'POST', {
        amount: 1500,
        currency: 'INR',
        purpose: 'membership_fee',
        associationId: assocAId,
      }, adminToken);

      assert.equal(orderRes.status, 201, 'Order creation must succeed');
      const orderId = orderRes.data.data.orderId;
      const validMockSig = `mock_sig_${orderId}`;

      const probeValid = await apiRequest('/payments/verify', 'POST', {
        orderId,
        paymentId: `pay_mock_${Date.now()}`,
        signature: validMockSig,
      }, adminToken);

      assert.equal(probeValid.status, 200, 'Valid mock signature must succeed with HTTP 200');
      assert.equal(probeValid.data.success, true);
    });

    test('§2.2 Auth Rate-Limiter Session Lockout: 15 consecutive /auth/me calls succeed without 429', async () => {
      for (let i = 0; i < 15; i++) {
        const res = await apiRequest('/auth/me', 'GET', null, adminToken);
        assert.equal(res.status, 200, `Call ${i + 1} to /auth/me must return 200 (got ${res.status})`);
      }
    });
  });

  describe('2. Multi-Tenancy Scoping & Isolation Guard (§3.1)', () => {
    test('Cross-tenant data access blocked: User from Assoc B cannot view Assoc A funds reports', async () => {
      const uniqueSuffix = Date.now();
      const officerEmail = `funds.b.${uniqueSuffix}@sports.com`;

      const createRes = await apiRequest(`/associations/${assocBId}/funds-officers`, 'POST', {
        name: `Funds Officer B ${uniqueSuffix}`,
        email: officerEmail,
        password: 'password123',
      }, adminToken);

      assert.ok(createRes.status === 201 || createRes.status === 200, 'Funds officer creation in Assoc B should succeed');

      const bLogin = await apiRequest('/auth/login', 'POST', {
        email: officerEmail,
        password: 'password123',
      });
      assert.equal(bLogin.status, 200, 'Assoc B funds officer login must succeed');
      const bToken = bLogin.data.data.token;

      // Attempt to access Assoc A's balance and financial reports
      const crossBalance = await apiRequest(`/funds/${assocAId}/balance`, 'GET', null, bToken);
      assert.equal(crossBalance.status, 403, 'Cross-tenant balance access must return 403 Forbidden');

      const crossReports = await apiRequest(`/funds/${assocAId}/reports`, 'GET', null, bToken);
      assert.equal(crossReports.status, 403, 'Cross-tenant financial reports access must return 403 Forbidden');
    });
  });

  describe('3. Match Operation & Scoring Rules (§3.2)', () => {
    test('Rule 12 Guard: Non-participating player cannot record ball/score on unrelated match', async () => {
      const matchesRes = await apiRequest('/matches', 'GET', null, adminToken);
      if (matchesRes.data?.data?.length > 0) {
        const match = matchesRes.data.data[0];

        const scoreAttempt = await apiRequest(`/scoring/${match._id}/cricket/ball`, 'POST', {
          batsmanId: '65f000000000000000000001',
          bowlerId: '65f000000000000000000002',
          runs: 4,
          isExtra: false,
        }, playerToken);

        assert.ok(
          scoreAttempt.status === 403 || scoreAttempt.status === 400,
          `Expected 403 or 400 for unauthorized scoring, got ${scoreAttempt.status}`
        );
      }
    });

    test('Completed/Inactive match rejects live scoring with HTTP 400', async () => {
      const matchesRes = await apiRequest('/matches?status=completed', 'GET', null, adminToken);
      if (matchesRes.data?.data?.length > 0) {
        const completedMatch = matchesRes.data.data[0];
        const res = await apiRequest(`/scoring/${completedMatch._id}/cricket/ball`, 'POST', {
          batsmanId: '65f000000000000000000001',
          bowlerId: '65f000000000000000000002',
          runs: 1,
        }, adminToken);

        assert.equal(res.status, 400, 'Scoring on completed match must return 400');
      }
    });
  });

  describe('4. Expense Requests Workflow & Payout Ledger (§3.4)', () => {
    test('Association Head approves proposal, Funds Officer marks paid into Fund ledger', async () => {
      // 1. Submit an expense proposal
      const proposeRes = await apiRequest('/expenses', 'POST', {
        purpose: 'Equipment repair test',
        category: 'equipment_repair',
        amount: 3500,
        notes: 'Repairs for training equipment',
        associationId: assocAId,
      }, adminToken);

      assert.equal(proposeRes.status, 201, 'Expense proposal should be created');
      const expenseId = proposeRes.data.data._id;
      assert.equal(proposeRes.data.data.status, 'pending');

      // 2. Head reviews and approves
      const reviewRes = await apiRequest(`/expenses/${expenseId}/review`, 'PUT', {
        status: 'approved',
      }, adminToken);
      assert.equal(reviewRes.status, 200, 'Expense approval should succeed');
      assert.equal(reviewRes.data.data.status, 'approved');

      // 3. Funds Officer marks as paid
      const payRes = await apiRequest(`/expenses/${expenseId}/pay`, 'POST', {
        paymentRef: `PAY-TEST-${Date.now()}`,
        notes: 'Disbursed via direct transfer',
      }, adminToken);
      assert.equal(payRes.status, 200, 'Expense payout should succeed');
      assert.equal(payRes.data.data.status, 'paid');
    });
  });

});
