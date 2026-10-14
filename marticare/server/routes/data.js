import { Router } from 'express';
import HealthRecord from '../models/HealthRecord.js';
import Baby from '../models/Baby.js';
import ClinicalNote from '../models/ClinicalNote.js';
import User from '../models/User.js';
import Permission from '../models/Permission.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();

// ---- Health Records ----
router.get('/health-records', auth, async (req, res) => {
  try {
    const query = { userId: req.query.userId || req.user._id };
    if (req.query.type) query.type = req.query.type;
    const records = await HealthRecord.find(query).sort({ createdAt: -1 }).limit(200);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/health-records', auth, async (req, res) => {
  try {
    const record = new HealthRecord({ ...req.body, userId: req.body.userId || req.user._id, recordedBy: req.user._id });
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Babies ----
router.get('/babies', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'mother') {
      query.motherId = req.user._id;
    } else {
      const perms = await Permission.find({ grantedTo: req.user._id, status: 'accepted' });
      query.motherId = { $in: perms.map(p => p.motherId) };
    }
    const babies = await Baby.find(query);
    res.json(babies);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/babies', auth, async (req, res) => {
  try {
    const baby = new Baby({ ...req.body, motherId: req.user._id });
    await baby.save();
    res.status(201).json(baby);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/babies/:id', auth, async (req, res) => {
  try {
    const baby = await Baby.findOneAndUpdate({ _id: req.params.id, motherId: req.user._id }, req.body, { new: true });
    if (!baby) return res.status(404).json({ message: 'Baby not found' });
    res.json(baby);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Clinical Notes (Doctor only) ----
router.get('/clinical-notes', auth, requireRole('doctor'), async (req, res) => {
  try {
    const query = { doctorId: req.user._id };
    if (req.query.patientId) query.patientId = req.query.patientId;
    const notes = await ClinicalNote.find(query).populate('patientId', 'name email').sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/clinical-notes', auth, requireRole('doctor'), async (req, res) => {
  try {
    const note = new ClinicalNote({ ...req.body, doctorId: req.user._id });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/clinical-notes/:id', auth, requireRole('doctor'), async (req, res) => {
  try {
    const note = await ClinicalNote.findOneAndUpdate({ _id: req.params.id, doctorId: req.user._id }, req.body, { new: true });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- Doctor patients ----
router.get('/patients', auth, requireRole('doctor'), async (req, res) => {
  try {
    const perms = await Permission.find({ grantedTo: req.user._id, status: 'accepted', grantedToRole: 'doctor' });
    const motherIds = perms.map(p => p.motherId);
    const patients = await User.find({ _id: { $in: motherIds } }).select('name email phone pregnancyDueDate isPostnatal avatar createdAt');
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
