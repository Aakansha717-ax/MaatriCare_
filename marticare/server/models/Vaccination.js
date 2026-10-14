import mongoose from 'mongoose';

const vaccinationSchema = new mongoose.Schema({
  motherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Baby' },
  vaccineName: { type: String, required: true, trim: true },
  disease: { type: String, default: '' },
  doseNumber: { type: Number, default: 1 },
  recommendedAge: { type: String, default: '' },
  scheduledDate: { type: Date },
  actualDate: { type: Date },
  status: { type: String, enum: ['upcoming', 'due', 'completed', 'overdue', 'rescheduled'], default: 'upcoming' },
  provider: { type: String, default: '' },
  vaccinationCenter: { type: String, default: '' },
  notes: { type: String, default: '' },
  nextDoseDate: { type: Date },
  administeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  batchNumber: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Vaccination', vaccinationSchema);
