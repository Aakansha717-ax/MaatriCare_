import { Router } from 'express';
import crypto from 'crypto';
import Permission from '../models/Permission.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// POST /api/permissions/invite — mother creates invite
router.post('/invite', auth, async (req, res) => {
  try {
    if (req.user.role !== 'mother') return res.status(403).json({ message: 'Only mothers can create invites' });

    const inviteCode = crypto.randomBytes(6).toString('hex');
    const permission = new Permission({
      motherId: req.user._id,
      grantedTo: null,
      grantedToRole: req.body.role || 'guardian',
      sharedItems: req.body.sharedItems || ['hydration', 'medicines', 'wellness', 'vaccinations', 'alerts', 'appointments'],
      inviteCode,
      status: 'pending'
    });
    await permission.save();
    res.status(201).json({ inviteCode, permission });
  } catch (err) {
    res.status(500).json({ message: 'Server error creating invite' });
  }
});

// POST /api/permissions/accept — guardian/doctor accepts invite
router.post('/accept', auth, async (req, res) => {
  try {
    const perm = await Permission.findOne({ inviteCode: req.body.inviteCode, status: 'pending' });
    if (!perm) return res.status(404).json({ message: 'Invalid or expired invite code' });
    if (req.user.role !== perm.grantedToRole) {
      return res.status(403).json({ message: `This invite is for a ${perm.grantedToRole} account` });
    }

    perm.grantedTo = req.user._id;
    perm.status = 'accepted';
    perm.consentDate = new Date();
    await perm.save();

    const mother = await User.findById(perm.motherId).select('name email');
    res.json({ message: 'Invite accepted', mother, permission: perm });
  } catch (err) {
    res.status(500).json({ message: 'Server error accepting invite' });
  }
});

// GET /api/permissions — get user's permissions
router.get('/', auth, async (req, res) => {
  try {
    let permissions;
    if (req.user.role === 'mother') {
      permissions = await Permission.find({ motherId: req.user._id }).populate('grantedTo', 'name email role');
    } else {
      permissions = await Permission.find({ grantedTo: req.user._id, status: 'accepted' }).populate('motherId', 'name email pregnancyDueDate isPostnatal sharingPrefs');
    }
    res.json(permissions);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching permissions' });
  }
});

// PUT /api/permissions/:id — update sharing items
router.put('/:id', auth, async (req, res) => {
  try {
    const perm = await Permission.findOne({ _id: req.params.id, motherId: req.user._id });
    if (!perm) return res.status(404).json({ message: 'Permission not found' });
    if (req.body.sharedItems) perm.sharedItems = req.body.sharedItems;
    await perm.save();
    res.json(perm);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/permissions/:id — revoke
router.delete('/:id', auth, async (req, res) => {
  try {
    const perm = await Permission.findOne({ _id: req.params.id, $or: [{ motherId: req.user._id }, { grantedTo: req.user._id }] });
    if (!perm) return res.status(404).json({ message: 'Permission not found' });
    perm.status = 'revoked';
    await perm.save();
    res.json({ message: 'Access revoked' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
