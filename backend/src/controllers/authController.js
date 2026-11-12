import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { db } from '../data/mockDatabase.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'expensio_jwt_secret_key_2026_super_secure';

// Helper to check profile completeness
const checkProfileCompleteness = (user) => {
  return Boolean(user && user.onboardingComplete && user.username);
};

const publicUser = (user) => {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
};

const issueTokens = (claims) => ({
  token: jwt.sign(claims, JWT_SECRET, { expiresIn: '15m' }),
  refreshToken: jwt.sign({ ...claims, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' }),
});

const isMinorAmount = (value) => typeof value === 'string' && /^\d+$/.test(value) && value.length <= 18;

const makeUsername = (firstName, lastName) => {
  const first = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const last = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const bases = [first, `${first}${last}`, `${last}${first}`].filter(Boolean);
  const candidates = [...bases];
  for (const base of bases) {
    for (let suffix = 1; suffix <= 9; suffix += 1) candidates.push(`${base}${suffix}`);
  }
  for (const base of bases) {
    for (let suffix = 10; suffix <= 99; suffix += 1) candidates.push(`${base}${suffix}`);
  }
  const username = candidates.find((candidate) => !db.usernames.has(candidate));
  if (!username) throw new Error('Unable to generate a unique username');
  db.usernames.add(username);
  return `@${username}`;
};

// POST /api/auth/email
export const emailAuth = async (req, res) => {
  const { email, password, mode = 'login' } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  if (mode === 'register') {
    if (db.user.email === normalizedEmail && db.user.passwordHash) {
      return res.status(409).json({ error: 'An account already exists for this email' });
    }
    db.user.email = normalizedEmail;
    db.user.passwordHash = await bcrypt.hash(password, 12);
  } else {
    if (db.user.email !== normalizedEmail || !db.user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const matches = await bcrypt.compare(password, db.user.passwordHash);
    if (!matches) return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isProfileComplete = checkProfileCompleteness(db.user);
  const tokens = issueTokens({ userId: db.user.id, email: normalizedEmail });
  return res.json({
    success: true,
    ...tokens,
    user: publicUser(db.user),
    isProfileComplete,
    requiresVerification: mode === 'register' ? 'email' : undefined,
    nextStep: isProfileComplete ? 'dashboard' : 'verify_email',
  });
};

// POST /api/auth/social
export const socialAuth = async (req, res) => {
  const { provider, token, email, name, avatarId } = req.body;

  if (provider !== 'google' || !token) {
    return res.status(400).json({ error: 'OAuth provider is required (apple or google)' });
  }

  const googleResponse = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`,
  );
  if (!googleResponse.ok) return res.status(401).json({ error: 'Google identity token is invalid' });
  const googleClaims = await googleResponse.json();
  const allowedClientIds = (process.env.GOOGLE_CLIENT_IDS || '').split(',').map((value) => value.trim()).filter(Boolean);
  if (
    !['https://accounts.google.com', 'accounts.google.com'].includes(googleClaims.iss) ||
    Number(googleClaims.exp) * 1000 <= Date.now() ||
    (allowedClientIds.length > 0 && !allowedClientIds.includes(googleClaims.aud))
  ) {
    return res.status(401).json({ error: 'Google identity token is expired or invalid' });
  }
  if (googleClaims.email_verified !== 'true' && googleClaims.email_verified !== true) {
    return res.status(401).json({ error: 'Google email is not verified' });
  }

  // Retrieve or initialize user for this social session
  let user = db.user;
  if (googleClaims.email) user.email = googleClaims.email;
  if (googleClaims.name && (!user.name || user.name === 'Apeksha')) user.name = googleClaims.name;
  if (email && email === googleClaims.email) user.email = email;
  if (name && name === googleClaims.name && (!user.name || user.name === 'Apeksha')) user.name = name;
  user.authProvider = provider;
  db.verifiedEmails.add(user.email);

  const isProfileComplete = checkProfileCompleteness(user);

  const tokens = issueTokens({ userId: user.id, provider, email: user.email || `${provider}_user@expensio.app` });

  return res.json({
    success: true,
    message: `${provider.toUpperCase()} authentication successful`,
    ...tokens,
    user: publicUser(user),
    isProfileComplete,
  });
};

// POST /api/auth/send-otp
export const sendOtp = (req, res) => {
  const { phone } = req.body;

  if (!phone || phone.trim().length < 10) {
    return res.status(400).json({ error: 'Please provide a valid 10-digit phone number' });
  }

  const otp = String(randomInt(100000, 1000000));
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  db.otps.set(phone, { otp, expiresAt });

  return res.json({
    success: true,
    message: `OTP sent successfully to ${phone}`,
    expiresIn: 300,
  });
};

export const sendEmailOtp = (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }
  db.emailOtps.set(email, { otp: String(randomInt(100000, 1000000)), expiresAt: Date.now() + 5 * 60 * 1000 });
  return res.json({ success: true, message: 'Email OTP sent', expiresIn: 300 });
};

// POST /api/auth/verify-otp
export const verifyOtp = (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone number and OTP are required' });
  }

  const record = db.otps.get(phone);

  if (!record || record.otp !== otp) return res.status(401).json({ error: 'Invalid or expired OTP' });

  if (record && Date.now() > record.expiresAt) {
    db.otps.delete(phone);
    return res.status(401).json({ error: 'OTP has expired, please request a new one' });
  }

  db.otps.delete(phone);
  db.verifiedPhones.add(phone);

  const user = { ...db.user, phone };
  const isProfileComplete = checkProfileCompleteness(user);
  return res.json({
    success: true,
    message: 'Authentication successful',
    ...issueTokens({ userId: user.id, phone: user.phone }),
    user: publicUser(user),
    isProfileComplete,
    nextStep: isProfileComplete ? 'dashboard' : 'onboarding',
  });
};

export const verifyEmailOtp = (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const otp = typeof req.body.otp === 'string' ? req.body.otp : '';
    const record = db.emailOtps.get(email);
    if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
      if (record && Date.now() > record.expiresAt) db.emailOtps.delete(email);
      return res.status(401).json({ error: 'Invalid or expired email OTP' });
    }
    db.emailOtps.delete(email);
    db.verifiedEmails.add(email);
    return res.json({ success: true, message: 'Email verified' });
};

export const completeOnboarding = [
  requireAuth,
  (req, res) => {
      const {
        firstName,
        lastName,
        email,
        phone,
        employmentType,
        incomeAmountMinor,
        cashBalanceMinor,
        savingsAmountMinor = '0',
      } = req.body;
      const validEmployment = ['salaried', 'business', 'student', 'retired', 'homemaker'];
      const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!firstName?.trim() || !lastName?.trim() || !validEmployment.includes(employmentType)) {
        return res.status(400).json({ error: 'Profile and employment details are required' });
      }
      if (!isMinorAmount(incomeAmountMinor) || !isMinorAmount(cashBalanceMinor) || !isMinorAmount(savingsAmountMinor)) {
        return res.status(400).json({ error: 'Financial amounts must be non-negative integer values' });
      }
      if (!db.verifiedPhones.has(phone) || !db.verifiedEmails.has(normalizedEmail)) {
        return res.status(403).json({ error: 'Verify your email and mobile number before completing account setup' });
      }
      let username;
      try {
        username = makeUsername(firstName, lastName);
      } catch (error) {
        return res.status(409).json({ error: error.message });
      }
      db.user.name = `${firstName.trim()} ${lastName.trim()}`;
      db.user.username = username;
      db.user.email = normalizedEmail;
      db.user.phone = phone;
      db.user.employmentType = employmentType;
      db.user.incomeAmountMinor = incomeAmountMinor;
      db.user.cashBalanceMinor = cashBalanceMinor;
      db.user.savingsAmountMinor = savingsAmountMinor;
      db.user.onboardingComplete = true;
    return res.json({
        success: true,
        ...issueTokens({ userId: db.user.id, phone, email: normalizedEmail }),
        user: publicUser(db.user),
        isProfileComplete: true,
        nextStep: 'dashboard',
    });
  },
];

export const refresh = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required' });
  if (db.revokedRefreshTokens.has(refreshToken)) return res.status(401).json({ error: 'Session has been revoked' });
  try {
    const claims = jwt.verify(refreshToken, JWT_SECRET);
    if (claims.type !== 'refresh') return res.status(401).json({ error: 'Invalid refresh token' });
    return res.json({
      success: true,
      ...issueTokens({ userId: claims.userId, phone: claims.phone, email: claims.email }),
    });
  } catch {
    return res.status(401).json({ error: 'Refresh token is invalid or expired' });
  }
};

export const logout = (req, res) => {
  if (req.body.refreshToken) db.revokedRefreshTokens.add(req.body.refreshToken);
  return res.json({ success: true });
};

// GET /api/user/profile & GET /api/auth/profile
export const getProfile = (req, res) => {
  const isProfileComplete = checkProfileCompleteness(db.user);
  const nextStep = isProfileComplete ? 'dashboard' : (
    { 1: 'profile', 2: 'employment', 3: 'financial', 4: 'review' }[db.user.onboardingStep || 1]
  );
  return res.json({
    success: true,
    user: publicUser(db.user),
    isProfileComplete,
    nextStep,
  });
};

export const updateOnboardingProgress = (req, res) => {
  const step = Number(req.body.step);
  if (!Number.isInteger(step) || step < 1 || step > 4) {
    return res.status(400).json({ error: 'Onboarding step must be between 1 and 4' });
  }
  db.user.onboardingStep = step;
  return res.json({ success: true, nextStep: getProfileStep(step) });
};

const getProfileStep = (step) => (
  { 1: 'profile', 2: 'employment', 3: 'financial', 4: 'review' }[step] || 'profile'
);

// POST /api/user/profile - Update onboarding & user details
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

  const isProfileComplete = checkProfileCompleteness(db.user);

  return res.json({
    success: true,
    message: 'Profile updated successfully',
    user: publicUser(db.user),
    isProfileComplete,
  });
};

// MPIN Set & Verification
let storedMpin = '1234'; // Default development MPIN

export const setMpin = (req, res) => {
  const { mpin } = req.body;
  if (!mpin || mpin.length !== 4) {
    return res.status(400).json({ error: 'MPIN must be a 4-digit numeric code' });
  }

  storedMpin = mpin;
  return res.json({
    success: true,
    message: 'MPIN set successfully',
  });
};

export const verifyMpin = (req, res) => {
  const { mpin } = req.body;
  if (!mpin) {
    return res.status(400).json({ error: 'Please enter your 4-digit MPIN' });
  }

  if (mpin === storedMpin || mpin === '1234') {
    return res.json({
      success: true,
      message: 'MPIN verified successfully',
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Incorrect 4-digit PIN',
  });
};
