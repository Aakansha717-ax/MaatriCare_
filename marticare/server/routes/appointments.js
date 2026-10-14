import { Router } from 'express';
import Appointment from '../models/Appointment.js';
import { auth } from '../middleware/auth.js';
import Permission from '../models/Permission.js';

const router = Router();

// GET /api/appointments
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'mother') {
      query.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctorId = req.user._id;
    } else if (req.user.role === 'guardian') {
      const perms = await Permission.find({ grantedTo: req.user._id, status: 'accepted' });
      query.patientId = { $in: perms.map(p => p.motherId) };
    }
    if (req.query.status) query.status = req.query.status;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization')
      .sort({ dateTime: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching appointments' });
  }
});

// POST /api/appointments
router.post('/', auth, async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    if (req.user.role === 'mother') data.patientId = req.user._id;
    if (req.user.role === 'doctor') data.doctorId = req.user._id;

    const appointment = new Appointment(data);
    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating appointment' });
  }
});

// PUT /api/appointments/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    Object.assign(appointment, req.body);
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating appointment' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
