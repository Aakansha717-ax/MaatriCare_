import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['vaccination', 'prenatal', 'postnatal', 'pediatric', 'doctor_followup', 'medicine', 'checkup', 'pregnancy_milestone', 'baby_growth', 'wellness', 'rescheduled', 'custom'],
    required: true
  },
  title: { type: String, required: true, trim: true },
  body: { type: String, default: '' },
  dateTime: { type: Date, required: true },
  recurrence: { type: String, enum: ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'custom'], default: 'none' },
  recurrenceEnd: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['active', 'completed', 'snoozed', 'cancelled'], default: 'active' },
  snoozedUntil: { type: Date },
  completedAt: { type: Date },
  relatedTo: { type: mongoose.Schema.Types.ObjectId },
  relatedModel: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deliveryLog: [{
    channel: String,
    sentAt: Date,
    success: Boolean
  }]
}, { timestamps: true });

export default mongoose.model('Reminder', reminderSchema);
