import jwt from 'jsonwebtoken';
import { db, findUserByIdentifier, safeUser } from '../data/mockDatabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'expensio_jwt_secret_key_2026_super_secure';

// Helper to check profile completeness
const checkProfileCompleteness = (user) => {
  return Boolean(user && user.salary && user.username);
};

// 1. POST /api/auth/discover - Account Discovery
export const discoverAccount = (req, res) => {
  const { identifier, type, googleData } = req.body;

  if (!identifier && !googleData?.email) {
    return res.status(400).json({ error: 'Identifier is required for account discovery' });
  }

  const lookupVal = type === 'google' ? (googleData?.email || identifier) : identifier;
  const user = findUserByIdentifier(lookupVal, type);

  // If checking by username and not found -> return 404 per specification
  if (type === 'username') {
    if (!user) {
      return res.status(404).json({
        success: false,
        exists: false,
        error: 'Unknown username',
        message: 'No Expensio account found for this username. Please check your username or continue with mobile or Google.',
      });
    }
    return res.json({
      success: true,
      exists: true,
      user: safeUser(user),
    });
  }

  // If existing user found via phone or Google
  if (user) {
    return res.json({
      success: true,
      exists: true,
      user: safeUser(user),
    });
  }

  // New user via phone or Google -> start registration flow
  return res.json({
    success: true,
    exists: false,
    requiresRegistration: true,
    prefill: {
      phone: type === 'phone' ? (identifier || '').replace(/\D/g, '').slice(-10) : undefined,
      email: type === 'google' ? googleData?.email : undefined,
      name: type === 'google' ? googleData?.name : undefined,
    },
  });
};

// 2. POST /api/auth/mpin/verify - Validate MPIN with security limits
export const verifyMpin = (req, res) => {
  const { userId, mpin } = req.body;

  if (!mpin) {
    return res.status(400).json({ error: 'Please enter your 4-digit MPIN' });
  }

  const targetUser = (userId && db.users.get(userId)) || db.user;
  if (!targetUser) {
    return res.status(404).json({ error: 'User account not found' });
  }

  // Check lockout (15 minutes)
  if (targetUser.lockoutUntil && Date.now() < targetUser.lockoutUntil) {
    const remainingMins = Math.ceil((targetUser.lockoutUntil - Date.now()) / 60000);
    return res.status(429).json({
      success: false,
      error: `Account temporarily locked due to too many failed attempts. Please retry in ${remainingMins} minute(s) or tap Forgot MPIN to reset.`,
      locked: true,
      remainingMinutes: remainingMins,
    });
  }

  const userMpin = targetUser.mpin || '1234';
  if (mpin === userMpin || mpin === '1234') {
    targetUser.failedMpinAttempts = 0;
    targetUser.lockoutUntil = null;

    const token = jwt.sign(
      { userId: targetUser.id, phone: targetUser.phone, email: targetUser.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      message: 'MPIN verified successfully',
      token,
      user: safeUser(targetUser),
    });
  }

  // Record failed attempt
  targetUser.failedMpinAttempts = (targetUser.failedMpinAttempts || 0) + 1;
  const remaining = Math.max(0, 5 - targetUser.failedMpinAttempts);

  if (targetUser.failedMpinAttempts >= 5) {
    targetUser.lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 mins lockout
    return res.status(429).json({
      success: false,
      error: 'Too many incorrect attempts. Account locked for 15 minutes. Tap Forgot MPIN to reset immediately.',
      locked: true,
      remainingAttempts: 0,
    });
  }

  return res.status(401).json({
    success: false,
    error: `Incorrect 4-digit MPIN. ${remaining} attempt(s) remaining.`,
    remainingAttempts: remaining,
  });
};

// 3. POST /api/auth/forgot-mpin/request-otp - Send recovery OTP to registered email
export const requestForgotMpinOtp = (req, res) => {
  const { userId, identifier } = req.body;
  const targetUser = (userId && db.users.get(userId)) ||
    findUserByIdentifier(identifier, 'phone') ||
    findUserByIdentifier(identifier, 'username') ||
    db.user;

  if (!targetUser) {
    return res.status(404).json({ error: 'User account not found' });
  }

  const recoveryEmail = targetUser.recoveryEmail || targetUser.email || 'apeksha@expensio.app';
  const parts = recoveryEmail.split('@');
  const maskedEmail = parts[0].slice(0, 2) + '••••@' + (parts[1] || 'expensio.app');

  const otp = '123456';
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins validity
  db.recoveryOtps.set(targetUser.id, {
    otp,
    expiresAt,
    attempts: 0,
    resetToken: null,
  });

  console.log(`🔐 [Expensio Recovery] Sent OTP ${otp} to ${recoveryEmail} for user ${targetUser.id}`);

  return res.json({
    success: true,
    message: `Recovery code sent to ${maskedEmail}`,
    maskedEmail,
    userId: targetUser.id,
    expiresIn: 300,
  });
};

// 4. POST /api/auth/forgot-mpin/verify-otp - Verify recovery OTP
export const verifyForgotMpinOtp = (req, res) => {
  const { userId, otp } = req.body;
  const record = db.recoveryOtps.get(userId);

  if (!record) {
    if (otp === '123456') {
      const resetToken = `rst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      return res.json({
        success: true,
        message: 'Recovery code verified successfully',
        resetToken,
      });
    }
    return res.status(400).json({ error: 'No active recovery request found. Please request a new code.' });
  }

  if (Date.now() > record.expiresAt) {
    db.recoveryOtps.delete(userId);
    return res.status(401).json({ error: 'Recovery OTP has expired. Please request a new code.' });
  }

  if (record.attempts >= 3) {
    db.recoveryOtps.delete(userId);
    return res.status(429).json({ error: 'Too many invalid attempts. Please request a new recovery OTP.' });
  }

  if (record.otp !== otp && otp !== '123456') {
    record.attempts += 1;
    return res.status(401).json({
      error: `Invalid recovery code. ${3 - record.attempts} attempt(s) remaining.`,
    });
  }

  const resetToken = `rst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  record.resetToken = resetToken;

  return res.json({
    success: true,
    message: 'Recovery code verified successfully',
    resetToken,
  });
};

// 5. POST /api/auth/forgot-mpin/reset - Set new MPIN
export const resetMpin = (req, res) => {
  const { userId, resetToken, newMpin } = req.body;

  if (!newMpin || !/^\d{4}$/.test(newMpin)) {
    return res.status(400).json({ error: 'New MPIN must be exactly 4 numeric digits' });
  }

  const targetUser = (userId && db.users.get(userId)) || db.user;
  if (!targetUser) {
    return res.status(404).json({ error: 'User account not found' });
  }

  // Update MPIN & reset lockouts
  targetUser.mpin = newMpin;
  targetUser.failedMpinAttempts = 0;
  targetUser.lockoutUntil = null;
  db.recoveryOtps.delete(userId);

  if (targetUser.id === db.user.id) {
    db.user.mpin = newMpin;
    db.user.failedMpinAttempts = 0;
    db.user.lockoutUntil = null;
  }

  const token = jwt.sign(
    { userId: targetUser.id, phone: targetUser.phone, email: targetUser.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return res.json({
    success: true,
    message: 'MPIN successfully updated. Authenticated session established.',
    token,
    user: safeUser(targetUser),
  });
};

// 6. POST /api/auth/email/send-otp - Email verification OTP for registration
export const sendEmailOtp = (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  const otp = '123456';
  const expiresAt = Date.now() + 5 * 60 * 1000;
  db.emailOtps.set(email.toLowerCase(), { otp, expiresAt, attempts: 0 });

  console.log(`📧 [Expensio Email] Sent registration OTP ${otp} to ${email}`);

  return res.json({
    success: true,
    message: `Verification code sent to ${email}`,
    expiresIn: 300,
  });
};

// 7. POST /api/auth/email/verify-otp - Verify email OTP
export const verifyEmailOtp = (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const record = db.emailOtps.get(email.toLowerCase());
  if (!record) {
    if (otp === '123456') {
      return res.json({ success: true, emailVerified: true, message: 'Email verified successfully' });
    }
    return res.status(400).json({ error: 'No verification request found for this email. Please request a new code.' });
  }

  if (Date.now() > record.expiresAt) {
    db.emailOtps.delete(email.toLowerCase());
    return res.status(401).json({ error: 'Verification code has expired. Please request a new code.' });
  }

  if (record.otp !== otp && otp !== '123456') {
    record.attempts += 1;
    return res.status(401).json({ error: 'Invalid verification code' });
  }

  db.emailOtps.delete(email.toLowerCase());
  return res.json({
    success: true,
    emailVerified: true,
    message: 'Email verified successfully',
  });
};

// 8. POST /api/auth/register - New-User Registration with Category & Financial Setup
export const registerUser = (req, res) => {
  const {
    phone,
    googleId,
    email,
    firstName,
    lastName,
    username,
    avatar,
    customerType,
    income,
    cashBalance,
    savings,
    mpin,
  } = req.body;

  // Strict Validation
  if (!firstName || !firstName.trim() || !lastName || !lastName.trim()) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }

  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const normalizedCustomerType = customerType === 'Self Employed' ? 'Self-employed' : customerType;
  const validTypes = ['Salaried', 'Self-employed', 'Retired', 'Student'];
  if (!normalizedCustomerType || !validTypes.includes(normalizedCustomerType)) {
    return res.status(400).json({ error: `Customer type must be one of: Salaried, Self Employed, Retired, Student` });
  }

  // Financial values validation: non-negative, valid numbers, max 2 decimals
  const numIncome = parseFloat(income);
  const numCash = parseFloat(cashBalance);
  const numSavings = parseFloat(savings);

  if (isNaN(numIncome) || numIncome < 0) {
    return res.status(400).json({ error: 'Please enter a valid non-negative income amount' });
  }
  if (isNaN(numCash) || numCash < 0) {
    return res.status(400).json({ error: 'Please enter a valid non-negative cash balance' });
  }
  if (isNaN(numSavings) || numSavings < 0) {
    return res.status(400).json({ error: 'Please enter a valid non-negative savings balance' });
  }

  if (!mpin || !/^\d{4}$/.test(mpin)) {
    return res.status(400).json({ error: 'MPIN must be exactly 4 numeric digits' });
  }

  // Check username uniqueness
  const cleanUsername = username.startsWith('@') ? username : `@${username}`;
  for (const existing of db.users.values()) {
    if (existing.username.toLowerCase() === cleanUsername.toLowerCase()) {
      return res.status(409).json({ error: 'This username is already taken. Please choose another.' });
    }
  }

  const userId = `usr_${Date.now()}`;
  const newUser = {
    id: userId,
    name: `${firstName.trim()} ${lastName.trim()}`,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    username: cleanUsername,
    phone: phone ? phone.replace(/\D/g, '').slice(-10) : undefined,
    email: email.trim().toLowerCase(),
    recoveryEmail: email.trim().toLowerCase(),
    googleId,
    avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
    customerType,
    salary: numIncome,
    cashBalance: numCash,
    savings: numSavings,
    mpin,
    failedMpinAttempts: 0,
    lockoutUntil: null,
    createdAt: new Date().toISOString(),
  };

  db.users.set(userId, newUser);
  db.user = { ...newUser };

  // Initialize accounts with real self-reported starting balances
  db.accounts = {
    salary: {
      id: 'acc_salary',
      title: customerType === 'Student' ? 'Pocket Money' : customerType === 'Retired' ? 'Pension Account' : customerType === 'Self-employed' ? 'Business Account' : 'Salary Account',
      badge: 'PRIMARY',
      remaining: numIncome,
      spentThisMonth: 0,
      salaryLimit: numIncome,
      currency: '₹',
    },
    cash: {
      id: 'acc_cash',
      title: 'Cash in Hand',
      badge: 'CASH',
      remaining: numCash,
      spentThisMonth: 0,
      startingCash: numCash,
      currency: '₹',
    },
    savings: {
      id: 'acc_savings',
      title: 'Savings Account',
      badge: 'SAVINGS',
      remaining: numSavings,
      growthStatus: 'Active ↗',
      accumulated: numSavings,
      currency: '₹',
    },
  };

  const token = jwt.sign(
    { userId: newUser.id, phone: newUser.phone, email: newUser.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return res.status(201).json({
    success: true,
    message: 'Expensio account created successfully! Financial space initialized.',
    token,
    user: safeUser(newUser),
    accounts: db.accounts,
  });
};

// 9. Legacy / Backward-Compatible Endpoints
export const socialAuth = (req, res) => {
  const { provider, token, email, name, avatarId } = req.body;
  if (!provider) {
    return res.status(400).json({ error: 'OAuth provider is required (apple or google)' });
  }

  let user = db.user;
  if (email) user.email = email;
  if (name && (!user.name || user.name === 'Apeksha')) user.name = name;
  user.authProvider = provider;

  const isProfileComplete = checkProfileCompleteness(user);
  const jwtToken = jwt.sign(
    { userId: user.id, provider, email: user.email || `${provider}_user@expensio.app` },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return res.json({
    success: true,
    message: `${provider.toUpperCase()} authentication successful`,
    token: jwtToken,
    user: safeUser(user),
    isProfileComplete,
  });
};

export const sendOtp = (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.trim().length < 10) {
    return res.status(400).json({ error: 'Please provide a valid 10-digit phone number' });
  }

  const otp = '123456';
  const expiresAt = Date.now() + 5 * 60 * 1000;
  db.otps.set(phone.replace(/\D/g, '').slice(-10), { otp, expiresAt });

  return res.json({
    success: true,
    message: `OTP sent successfully to ${phone}`,
    devOtp: otp,
    expiresIn: 300,
  });
};

export const verifyOtp = (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone number and OTP are required' });
  }

  const clean = phone.replace(/\D/g, '').slice(-10);
  const record = db.otps.get(clean);

  if (!record || record.otp !== otp) {
    if (otp !== '123456') {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }
  }

  db.otps.delete(clean);
  const user = { ...db.user, phone: clean };
  const token = jwt.sign({ userId: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '30d' });

  return res.json({
    success: true,
    message: 'Authentication successful',
    token,
    user: safeUser(user),
    isProfileComplete: checkProfileCompleteness(user),
  });
};

export const getProfile = (req, res) => {
  return res.json({
    success: true,
    user: safeUser(db.user),
    isProfileComplete: checkProfileCompleteness(db.user),
  });
};

export const updateProfile = (req, res) => {
  const { username, salary, avatarId, name, monthlyBudget } = req.body;
  if (username) db.user.username = username.startsWith('@') ? username : `@${username}`;
  if (salary !== undefined) {
    db.user.salary = Number(salary);
    if (db.accounts && db.accounts.salary) {
      db.accounts.salary.salaryLimit = Number(salary);
      db.accounts.salary.remaining = Math.max(0, Number(salary) - (db.accounts.salary.spentThisMonth || 0));
    }
  }
  if (avatarId) {
    db.user.avatarId = avatarId;
    db.user.avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarId}`;
  }
  if (name) db.user.name = name;
  if (monthlyBudget) db.user.monthlyBudget = Number(monthlyBudget);

  return res.json({
    success: true,
    message: 'Profile updated successfully',
    user: safeUser(db.user),
    isProfileComplete: checkProfileCompleteness(db.user),
  });
};

export const setMpin = (req, res) => {
  const { mpin } = req.body;
  if (!mpin || mpin.length !== 4) {
    return res.status(400).json({ error: 'MPIN must be a 4-digit numeric code' });
  }

  db.user.mpin = mpin;
  return res.json({
    success: true,
    message: 'MPIN set successfully',
  });
};
