import mongoose from 'mongoose';

const clinicalNoteSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  diagnosis: { type: String, default: '' },
  prescription: { type: String, default: '' },
  recommendations: { type: String, default: '' },
  followUpDate: { type: Date },
  followUpInstructions: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('ClinicalNote', clinicalNoteSchema);
