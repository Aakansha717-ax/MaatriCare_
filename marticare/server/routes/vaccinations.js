import { Router } from 'express';
import Vaccination from '../models/Vaccination.js';
import { auth, requireRole } from '../middleware/auth.js';
import Permission from '../models/Permission.js';

const router = Router();

// GET /api/vaccinations — user's vaccinations (or patient's for doctor)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'mother') {
      query.motherId = req.user._id;
    } else if (req.user.role === 'guardian') {
      const perms = await Permission.find({ grantedTo: req.user._id, status: 'accepted' });
      const motherIds = perms.map(p => p.motherId);
      query.motherId = { $in: motherIds };
    } else if (req.user.role === 'doctor') {
      const perms = await Permission.find({ grantedTo: req.user._id, status: 'accepted', grantedToRole: 'doctor' });
      const motherIds = perms.map(p => p.motherId);
      query.motherId = { $in: motherIds };
    }
    if (req.query.motherId) query.motherId = req.query.motherId;
    if (req.query.childId) query.childId = req.query.childId;
    if (req.query.status) query.status = req.query.status;

    const vaccinations = await Vaccination.find(query).sort({ scheduledDate: 1 });
    res.json(vaccinations);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching vaccinations' });
  }
});

// POST /api/vaccinations
router.post('/', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.user.role === 'mother') data.motherId = req.user._id;
    if (req.user.role === 'doctor') data.administeredBy = req.user._id;

    const vaccination = new Vaccination(data);
    await vaccination.save();
    res.status(201).json(vaccination);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating vaccination' });
  }
});

// PUT /api/vaccinations/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const vaccination = await Vaccination.findById(req.params.id);
    if (!vaccination) return res.status(404).json({ message: 'Vaccination not found' });

    // Check authorization
    const isOwner = vaccination.motherId.toString() === req.user._id.toString();
    const isDoctor = req.user.role === 'doctor';
    if (!isOwner && !isDoctor) return res.status(403).json({ message: 'Not authorized' });

    Object.assign(vaccination, req.body);
    await vaccination.save();
    res.json(vaccination);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating vaccination' });
  }
});

// DELETE /api/vaccinations/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const vaccination = await Vaccination.findById(req.params.id);
    if (!vaccination) return res.status(404).json({ message: 'Vaccination not found' });
    if (vaccination.motherId.toString() !== req.user._id.toString() && req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await vaccination.deleteOne();
    res.json({ message: 'Vaccination deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting vaccination' });
  }
});

export default router;
