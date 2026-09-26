import jwt from 'jsonwebtoken';
import { db } from '../data/mockDatabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'expensio_jwt_secret_key_2026_super_secure';

// Helper to check profile completeness
const checkProfileCompleteness = (user) => {
  return Boolean(user && user.salary && user.avatarId && user.username);
};

// POST /api/auth/social
export const socialAuth = (req, res) => {
  const { provider, token, email, name, avatarId } = req.body;

  if (!provider) {
    return res.status(400).json({ error: 'OAuth provider is required (apple or google)' });
  }

  console.log(`🔐 [Social Auth] Login attempt with ${provider}, token prefix: ${token ? token.substring(0, 10) + '...' : 'none'}`);

  // Retrieve or initialize user for this social session
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
    user,
    isProfileComplete,
  });
};

// POST /api/auth/send-otp
export const sendOtp = (req, res) => {
  const { phone } = req.body;

  if (!phone || phone.trim().length < 10) {
    return res.status(400).json({ error: 'Please provide a valid 10-digit phone number' });
  }

  // Generate 6-digit OTP (in dev, defaults to 123456 for fast testing or generates randomly)
  const otp = '123456';
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  db.otps.set(phone, { otp, expiresAt });

  console.log(`📲 [Expensio SMS] Sent OTP ${otp} to phone ${phone}`);

  return res.json({
    success: true,
    message: `OTP sent successfully to ${phone}`,
    devOtp: otp, // Returned for instant development & pairing
    expiresIn: 300,
  });
};

// POST /api/auth/verify-otp
export const verifyOtp = (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone number and OTP are required' });
  }

  const record = db.otps.get(phone);

  // Accept valid OTP or fallback master dev OTP
  if (!record || record.otp !== otp) {
    if (otp !== '123456') {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }
  }

  if (record && Date.now() > record.expiresAt) {
    db.otps.delete(phone);
    return res.status(401).json({ error: 'OTP has expired, please request a new one' });
  }

  db.otps.delete(phone);

  // Update or retrieve user
  const user = {
    ...db.user,
    phone,
  };

  const isProfileComplete = checkProfileCompleteness(user);

  const token = jwt.sign(
    { userId: user.id, phone: user.phone },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return res.json({
    success: true,
    message: 'Authentication successful',
    token,
    user,
    isProfileComplete,
  });
};

// GET /api/user/profile & GET /api/auth/profile
export const getProfile = (req, res) => {
  const isProfileComplete = checkProfileCompleteness(db.user);
  return res.json({
    success: true,
    user: db.user,
    isProfileComplete,
  });
};

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
    user: db.user,
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
