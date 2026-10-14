import mongoose from 'mongoose';

const babySchema = new mongoose.Schema({
  motherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  bloodType: { type: String, default: '' },
  birthWeight: { type: Number }, // kg
  birthHeight: { type: Number }, // cm
  growthRecords: [{
    date: Date,
    weight: Number,
    height: Number,
    headCircumference: Number,
    notes: String
  }]
}, { timestamps: true });

export default mongoose.model('Baby', babySchema);
