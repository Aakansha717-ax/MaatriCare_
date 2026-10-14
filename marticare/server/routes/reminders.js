import { Router } from 'express';
import Reminder from '../models/Reminder.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// GET /api/reminders
router.get('/', auth, async (req, res) => {
  try {
    const query = { userId: req.user._id };
    if (req.query.status) query.status = req.query.status;
    if (req.query.category) query.category = req.query.category;

    const reminders = await Reminder.find(query).sort({ dateTime: 1 });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching reminders' });
  }
});

// POST /api/reminders
router.post('/', auth, async (req, res) => {
  try {
    const reminder = new Reminder({ ...req.body, userId: req.user._id, createdBy: req.user._id });
    await reminder.save();
    res.status(201).json(reminder);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating reminder' });
  }
});

// PUT /api/reminders/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    Object.assign(reminder, req.body);
    await reminder.save();
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating reminder' });
  }
});

// PUT /api/reminders/:id/complete
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    reminder.status = 'completed';
    reminder.completedAt = new Date();
    await reminder.save();
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/reminders/:id/snooze
router.put('/:id/snooze', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    reminder.status = 'snoozed';
    reminder.snoozedUntil = new Date(Date.now() + (req.body.minutes || 30) * 60000);
    await reminder.save();
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/reminders/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Reminder deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting reminder' });
  }
});

export default router;
