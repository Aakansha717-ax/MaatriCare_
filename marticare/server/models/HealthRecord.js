import mongoose from 'mongoose';

const healthRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['vitals', 'symptom', 'lab_result', 'weight', 'blood_pressure', 'mood', 'note'], required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('HealthRecord', healthRecordSchema);
