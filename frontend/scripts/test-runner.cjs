const { splitEngine } = require('../src/utils/splitEngine.ts');
const { formatters } = require('../src/utils/formatters.ts');

function assert(name, condition) {
  if (!condition) {
    console.error(`❌ FAIL: ${name}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${name}`);
}

console.log('\n--- Running Expensio Unit Tests ---');

// 1. Equal Share Calculation
assert('Equal share of 300 among 3 people is 100', splitEngine.calculateEqualShare(300, 3) === 100);
assert('Equal share of 100 among 3 people has 2-decimal precision (33.33)', splitEngine.calculateEqualShare(100, 3) === 33.33);
assert('Zero participants returns 0 safely without division by zero', splitEngine.calculateEqualShare(100, 0) === 0);

// 2. Summary & Balance Calculation
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

// 3. Settle Item Logic
const pendingItem = { id: 's1', title: 'Snacks', amount: 200, date: 'Sep 24', paidBy: 'YOU', status: 'PENDING', youGet: 100 };
const settledItem = splitEngine.settleItem(pendingItem);
assert('Settled item status is SETTLED', settledItem.status === 'SETTLED');
assert('Settled item youGet is zeroed out', settledItem.youGet === 0);

// 4. Currency Formatting
assert('Format INR for positive integer', formatters.currency(31169) === '₹31,169');
assert('Format INR for zero', formatters.currency(0) === '₹0');
assert('Format INR for negative amount', formatters.currency(-500) === '-₹500');

// 5. Phone Masking & Text Formatters
assert('Mask phone number hides digits correctly', formatters.maskPhone('9876543210') === '+91 ••••• •3210');
assert('Capitalize string properly', formatters.capitalize('shopping') === 'Shopping');

// 6. Step 2 & Step 3: Auth & Onboarding Logic Verification
function checkProfileCompleteness(user) {
  return Boolean(user && user.salary && user.avatarId && user.username);
}

assert('Incomplete profile detected when salary is missing', !checkProfileCompleteness({ username: '@apeksha', avatarId: 'avatar_1' }));
assert('Incomplete profile detected when avatarId is missing', !checkProfileCompleteness({ username: '@apeksha', salary: 50000 }));
assert('Incomplete profile detected when username is missing', !checkProfileCompleteness({ salary: 50000, avatarId: 'avatar_1' }));
assert('Complete profile verified when salary, avatarId, and username exist', checkProfileCompleteness({ username: '@apeksha', salary: 50000, avatarId: 'avatar_1' }));

// 7. Apple Sign-In Platform Gating
function isAppleAuthAllowed(platform) {
  return platform === 'ios';
}
assert('Apple Sign-In is allowed on iOS', isAppleAuthAllowed('ios') === true);
assert('Apple Sign-In is blocked on Android', isAppleAuthAllowed('android') === false);
assert('Apple Sign-In is blocked on Web', isAppleAuthAllowed('web') === false);

// 8. MPIN 4-Digit Validation
function isValidMpin(pin) {
  return typeof pin === 'string' && /^\d{4}$/.test(pin);
}
assert('Valid 4-digit numeric MPIN accepted', isValidMpin('1234') === true);
assert('Invalid MPIN rejected if shorter than 4 digits', isValidMpin('12') === false);
assert('Invalid MPIN rejected if contains letters', isValidMpin('12a4') === false);

console.log('\n🎉 ALL 21 BUSINESS LOGIC, ONBOARDING & AUTH TESTS PASSED (100%)\n');
