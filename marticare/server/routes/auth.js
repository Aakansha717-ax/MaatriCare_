
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { body, validationResult } from 'express-validator';

import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = Router();

const generateToken = (id) =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .isIn(['mother', 'guardian', 'doctor'])
      .withMessage('Invalid role'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: errors.array()[0].msg,
        });
      }

      const { name, email, password, role } = req.body;

      const existing = await User.findOne({ email });

      if (existing) {
        return res.status(400).json({
          message: 'An account with this email already exists',
        });
      }

      const user = new User({
        name,
        email,
        password,
        role,
        verified: role !== 'doctor',
      });

      await user.save();

      const token = generateToken(user._id);

      return res.status(201).json({
        token,
        user: user.toPublic(),
      });
    } catch (err) {
      console.error('Signup error:', err);

      return res.status(500).json({
        message: 'Server error during signup',
      });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: errors.array()[0].msg,
        });
      }

      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(401).json({
          message: 'Invalid email or password',
        });
      }

      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        return res.status(401).json({
          message: 'Invalid email or password',
        });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user._id);

      return res.json({
        token,
        user: user.toPublic(),
      });
    } catch (err) {
      console.error('Login error:', err);

      return res.status(500).json({
        message: 'Server error during login',
      });
    }
  }
);

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  return res.json({
    user: req.user.toPublic(),
  });
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const allowed = [
      'name',
      'phone',
      'address',
      'dateOfBirth',
      'avatar',
      'specialization',
      'licenseNumber',
      'hospital',
      'pregnancyDueDate',
      'pregnancyStartDate',
      'isPostnatal',
      'notificationPrefs',
      'sharingPrefs',
    ];

    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    return res.json({
      user: user.toPublic(),
    });
  } catch (err) {
    console.error('Profile update error:', err);

    return res.status(500).json({
      message: 'Server error updating profile',
    });
  }
});

// PUT /api/auth/change-password
router.put(
  '/change-password',
  auth,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: errors.array()[0].msg,
        });
      }

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          message: 'User not found',
        });
      }

      const isMatch = await user.comparePassword(
        req.body.currentPassword
      );

      if (!isMatch) {
        return res.status(400).json({
          message: 'Current password is incorrect',
        });
      }

      user.password = req.body.newPassword;
      await user.save();

      return res.json({
        message: 'Password changed successfully',
      });
    } catch (err) {
      console.error('Change password error:', err);

      return res.status(500).json({
        message: 'Server error changing password',
      });
    }
  }
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    try {
      const user = await User.findOne({
        email: req.body.email,
      });

      if (!user) {
        return res.json({
          message:
            'If an account exists with that email, a reset link has been sent.',
        });
      }

      const token = crypto.randomBytes(32).toString('hex');

      user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      user.resetPasswordExpires = Date.now() + 3600000;

      await user.save();

      // Development only: use an email provider in production.
      console.log(
        `Password reset token for ${user.email}: ${token}`
      );

      return res.json({
        message:
          'If an account exists with that email, a reset link has been sent.',
        _devToken: token,
      });
    } catch (err) {
      console.error('Forgot password error:', err);

      return res.status(500).json({
        message: 'Server error',
      });
    }
  }
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: errors.array()[0].msg,
        });
      }

      const hashedToken = crypto
        .createHash('sha256')
        .update(req.body.token)
        .digest('hex');

      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          message: 'Invalid or expired reset token',
        });
      }

      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      const token = generateToken(user._id);

      return res.json({
        token,
        user: user.toPublic(),
        message: 'Password reset successful',
      });
    } catch (err) {
      console.error('Reset password error:', err);

      return res.status(500).json({
        message: 'Server error resetting password',
      });
    }
  }
);

export default router;
