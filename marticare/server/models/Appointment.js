import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['prenatal', 'postnatal', 'pediatric', 'general', 'followup', 'vaccination', 'emergency'], default: 'general' },
  title: { type: String, required: true, trim: true },
  dateTime: { type: Date, required: true },
  duration: { type: Number, default: 30 }, // minutes
  location: { type: String, default: '' },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'], default: 'scheduled' },
  notes: { type: String, default: '' },
  followUpDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Appointment', appointmentSchema);
