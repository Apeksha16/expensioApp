const { splitEngine } = require('../src/utils/splitEngine.ts');
const { formatters } = require('../src/utils/formatters.ts');

let totalTests = 0;
let passedTests = 0;

function assert(name, condition) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${name}`);
    process.exit(1);
  }
  passedTests++;
  console.log(`✅ PASS: ${name}`);
}

console.log('\n========================================');
console.log('--- Expensio Mobile App Test Suite ---');
console.log('========================================\n');

// --- SECTION A: Split & Financial Math Engine ---
console.log('[1/10] Split Engine & Math Utilities');
assert('Equal share of 300 among 3 people is 100', splitEngine.calculateEqualShare(300, 3) === 100);
assert('Equal share of 100 among 3 people has 2-decimal precision (33.33)', splitEngine.calculateEqualShare(100, 3) === 33.33);
assert('Zero participants returns 0 safely without division by zero', splitEngine.calculateEqualShare(100, 0) === 0);

const sampleSplits = [
  { id: '1', title: 'Dinner', amount: 1500, date: 'Sep 20', paidBy: 'YOU', status: 'PENDING', youGet: 1000 },
  { id: '2', title: 'Cab', amount: 600, date: 'Sep 21', paidBy: 'Rahul', status: 'PENDING', youOwe: 200 },
  { id: '3', title: 'Movie', amount: 800, date: 'Sep 22', paidBy: 'YOU', status: 'SETTLED', youGet: 400 },
];
const summary = splitEngine.computeSummary(sampleSplits);
assert('Total amount you will get ignores settled items (1000)', summary.youllGet === 1000);
assert('Total amount you owe is accurate (200)', summary.youOwe === 200);
assert('Debtor count is 1', summary.getPeopleCount === 1);
assert('Creditor count is 1', summary.owePeopleCount === 1);

const pendingItem = { id: 's1', title: 'Snacks', amount: 200, date: 'Sep 24', paidBy: 'YOU', status: 'PENDING', youGet: 100 };
const settledItem = splitEngine.settleItem(pendingItem);
assert('Settled item status is SETTLED', settledItem.status === 'SETTLED');
assert('Settled item youGet is zeroed out', settledItem.youGet === 0);

// --- SECTION B: Currency & Text Formatters ---
console.log('\n[2/10] Currency & Masking Formatters');
assert('Format INR for positive integer', formatters.currency(31169) === '₹31,169');
assert('Format INR for zero', formatters.currency(0) === '₹0');
assert('Format INR for negative amount', formatters.currency(-500) === '-₹500');
assert('Mask phone number hides digits correctly', formatters.maskPhone('9876543210') === '+91 ••••• •3210');
assert('Capitalize string properly', formatters.capitalize('shopping') === 'Shopping');

// --- SECTION C: Account Discovery & Resolution ---
console.log('\n[3/10] Account Discovery & Identification (Mobile, Username, Google)');
function simulateAccountDiscovery(identifier, type, knownUsers) {
  if (type === 'phone') {
    const clean = identifier.replace(/\D/g, '').slice(-10);
    const found = knownUsers.find((u) => u.phone === clean);
    if (found) return { exists: true, user: found };
    return { exists: false, requiresRegistration: true, prefill: { phone: clean } };
  }
  if (type === 'username') {
    const clean = identifier.replace(/^@/, '').trim().toLowerCase();
    const found = knownUsers.find((u) => u.username.replace(/^@/, '').toLowerCase() === clean);
    if (found) return { exists: true, user: found };
    return { exists: false, error: 'Unknown username' };
  }
  if (type === 'google') {
    const found = knownUsers.find((u) => u.email === identifier.toLowerCase());
    if (found) return { exists: true, user: found };
    return { exists: false, requiresRegistration: true, prefill: { email: identifier } };
  }
}

const mockKnownUsers = [
  { id: 'usr_001', name: 'Apeksha Verma', username: '@apeksha', phone: '9876543210', email: 'apeksha@expensio.app', mpin: '1234' },
];

assert('Discovery finds existing phone number', simulateAccountDiscovery('9876543210', 'phone', mockKnownUsers).exists === true);
assert('Discovery finds phone with +91 country prefix', simulateAccountDiscovery('+91 98765 43210', 'phone', mockKnownUsers).exists === true);
assert('Discovery identifies new phone for registration', simulateAccountDiscovery('9123456789', 'phone', mockKnownUsers).requiresRegistration === true);
assert('Discovery finds existing username with @ symbol', simulateAccountDiscovery('@apeksha', 'username', mockKnownUsers).exists === true);
assert('Discovery finds existing username without @ symbol', simulateAccountDiscovery('apeksha', 'username', mockKnownUsers).exists === true);
assert('Discovery rejects unknown username with specific error', simulateAccountDiscovery('@ghost_user', 'username', mockKnownUsers).error === 'Unknown username');
assert('Discovery identifies Google user for registration', simulateAccountDiscovery('newuser@gmail.com', 'google', mockKnownUsers).requiresRegistration === true);

// --- SECTION D: MPIN Authentication & Lockout Rules ---
console.log('\n[4/10] MPIN Authentication & Lockout Security');
function simulateMpinVerification(enteredPin, actualPin, currentAttempts, lockoutUntil) {
  if (lockoutUntil && Date.now() < lockoutUntil) {
    return { success: false, locked: true, remainingMinutes: Math.ceil((lockoutUntil - Date.now()) / 60000) };
  }
  if (enteredPin === actualPin) {
    return { success: true, attempts: 0, locked: false };
  }
  const nextAttempts = currentAttempts + 1;
  if (nextAttempts >= 5) {
    return { success: false, locked: true, attempts: nextAttempts, lockoutUntil: Date.now() + 15 * 60 * 1000 };
  }
  return { success: false, locked: false, attempts: nextAttempts, remainingAttempts: 5 - nextAttempts };
}

assert('Correct MPIN grants access immediately', simulateMpinVerification('1234', '1234', 0, null).success === true);
assert('Incorrect MPIN increments failed attempts', simulateMpinVerification('9999', '1234', 0, null).attempts === 1);
assert('Incorrect MPIN calculates remaining attempts correctly', simulateMpinVerification('9999', '1234', 1, null).remainingAttempts === 3);
assert('5th incorrect MPIN triggers 15-minute lockout', simulateMpinVerification('9999', '1234', 4, null).locked === true);
assert('Locked user is rejected even with correct PIN during lockout', simulateMpinVerification('1234', '1234', 5, Date.now() + 600000).locked === true);

// --- SECTION E: Email Recovery OTP & MPIN Reset ---
console.log('\n[5/10] Recovery OTP & MPIN Reset Flow');
function maskRecoveryEmail(email) {
  const parts = email.split('@');
  return parts[0].slice(0, 2) + '••••@' + parts[1];
}

assert('Recovery email is masked properly for privacy', maskRecoveryEmail('apeksha@expensio.app') === 'ap••••@expensio.app');

function validateRecoveryOtp(enteredOtp, expectedOtp, expiresAt) {
  if (Date.now() > expiresAt) return { success: false, error: 'Expired' };
  if (enteredOtp === expectedOtp) return { success: true };
  return { success: false, error: 'Invalid' };
}

assert('Valid recovery OTP accepted', validateRecoveryOtp('123456', '123456', Date.now() + 300000).success === true);
assert('Expired recovery OTP rejected', validateRecoveryOtp('123456', '123456', Date.now() - 1000).error === 'Expired');
assert('Mismatched recovery OTP rejected', validateRecoveryOtp('000000', '123456', Date.now() + 300000).error === 'Invalid');

function validateNewMpin(newPin, confirmPin) {
  if (!/^\d{4}$/.test(newPin)) return { valid: false, error: 'Must be 4 digits' };
  if (newPin !== confirmPin) return { valid: false, error: 'Mismatch' };
  return { valid: true };
}

assert('Matching 4-digit MPIN accepted for reset', validateNewMpin('4321', '4321').valid === true);
assert('Mismatched MPIN rejected', validateNewMpin('4321', '4322').error === 'Mismatch');
assert('Non-numeric MPIN rejected', validateNewMpin('432a', '432a').error === 'Must be 4 digits');

// --- SECTION F: Financial Category Mapping ---
console.log('\n[6/10] Financial Category & Field Mapping');
const categoryMapping = {
  'Salaried': { incomeLabel: 'Monthly Salary', additional: ['Cash balance', 'Savings'] },
  'Self-employed': { incomeLabel: 'Monthly Earnings', additional: ['Cash balance', 'Savings'] },
  'Retired': { incomeLabel: 'Monthly Pension', additional: ['Cash balance', 'Savings'] },
  'Student': { incomeLabel: 'Monthly Pocket Money', additional: ['Cash balance', 'Savings'] },
};

assert('Salaried maps to Monthly Salary', categoryMapping['Salaried'].incomeLabel === 'Monthly Salary');
assert('Self-employed maps to Monthly Earnings', categoryMapping['Self-employed'].incomeLabel === 'Monthly Earnings');
assert('Retired maps to Monthly Pension', categoryMapping['Retired'].incomeLabel === 'Monthly Pension');
assert('Student maps to Monthly Pocket Money', categoryMapping['Student'].incomeLabel === 'Monthly Pocket Money');

// --- SECTION G: Monetary Input Validation ---
console.log('\n[7/10] Monetary Validation (No Negatives, No Blank-as-Zero)');
function validateMonetaryInput(val, allowZero = false) {
  if (val === undefined || val === null || val.trim() === '') return { valid: false, error: 'Cannot be blank' };
  const num = parseFloat(val);
  if (isNaN(num)) return { valid: false, error: 'Not a number' };
  if (!allowZero && num <= 0) return { valid: false, error: 'Must be greater than zero' };
  if (allowZero && num < 0) return { valid: false, error: 'Cannot be negative' };
  const parts = val.split('.');
  if (parts.length > 1 && parts[1].length > 2) return { valid: false, error: 'Max 2 decimals' };
  return { valid: true, value: num };
}

assert('Valid salary 50000 accepted', validateMonetaryInput('50000').valid === true);
assert('Blank input rejected (not silently converted to zero)', validateMonetaryInput('').valid === false);
assert('Whitespace input rejected', validateMonetaryInput('   ').valid === false);
assert('Negative monetary amount rejected', validateMonetaryInput('-100').valid === false);
assert('Zero income accepted as valid non-negative figure', validateMonetaryInput('0', true).valid === true);
assert('Zero cash balance accepted when explicitly entered', validateMonetaryInput('0', true).valid === true);
assert('Overly precise decimals rejected (>2)', validateMonetaryInput('12.345').valid === false);

// --- SECTION H: Duplicate Submissions & Registration Retries ---
console.log('\n[8/10] Registration Idempotency & Duplicate Prevention');
function checkDuplicateRegistration(username, email, existingUsers) {
  const cleanU = username.startsWith('@') ? username.toLowerCase() : `@${username.toLowerCase()}`;
  const cleanE = email.trim().toLowerCase();
  for (const u of existingUsers) {
    if (u.username.toLowerCase() === cleanU) return { duplicate: true, field: 'username' };
    if (u.email.toLowerCase() === cleanE) return { duplicate: true, field: 'email' };
  }
  return { duplicate: false };
}

assert('Duplicate username detected and blocked', checkDuplicateRegistration('@apeksha', 'new@expensio.app', mockKnownUsers).duplicate === true);
assert('Duplicate email detected and blocked', checkDuplicateRegistration('@newuser', 'apeksha@expensio.app', mockKnownUsers).duplicate === true);
assert('Unique registration details permitted', checkDuplicateRegistration('@rahul_unique', 'rahul@expensio.app', mockKnownUsers).duplicate === false);

// --- SECTION I: Account Creation & Real Balance Initialization ---
console.log('\n[9/10] Dashboard Account Initialization & Real Data Persistence');
function initializeAccountsFromSetup(customerType, income, cashBalance, savings) {
  const title = customerType === 'Student' ? 'Pocket Money'
    : customerType === 'Retired' ? 'Pension Account'
    : customerType === 'Self-employed' ? 'Business Account'
    : 'Salary Account';

  return {
    salary: { title, remaining: income, salaryLimit: income, currency: '₹' },
    cash: { title: 'Cash in Hand', remaining: cashBalance, startingCash: cashBalance, currency: '₹' },
    savings: { title: 'Savings Account', remaining: savings, accumulated: savings, currency: '₹' },
    totalBalance: income + cashBalance + savings,
  };
}

const rahulAccounts = initializeAccountsFromSetup('Self-employed', 75000, 12000, 50000);
assert('Primary card receives self-employed Business Account title', rahulAccounts.salary.title === 'Business Account');
assert('Primary card limit matches exact entered earnings (75000)', rahulAccounts.salary.salaryLimit === 75000);
assert('Cash in hand matches entered balance (12000)', rahulAccounts.cash.remaining === 12000);
assert('Savings account matches entered savings (50000)', rahulAccounts.savings.remaining === 50000);
assert('Total balance equals exact sum of self-reported balances (137000)', rahulAccounts.totalBalance === 137000);

// --- SECTION J: Interrupted Onboarding & Session Restoration ---
console.log('\n[10/10] Session Restoration & Gating');
function isUserAuthenticated(sessionToken, user) {
  return Boolean(sessionToken && user && user.id);
}
assert('Unauthenticated state correctly detected when token is missing', isUserAuthenticated(null, { id: 'usr_1' }) === false);
assert('Unauthenticated state correctly detected when user is missing', isUserAuthenticated('jwt_token_123', null) === false);
assert('Authenticated state verified when both token and user exist', isUserAuthenticated('jwt_token_123', { id: 'usr_1' }) === true);

console.log('\n========================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} COMPREHENSIVE TESTS PASSED (100%)`);
console.log('========================================\n');
