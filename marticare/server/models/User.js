import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['mother', 'guardian', 'doctor'], required: true },
  verified: { type: Boolean, default: false },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  dateOfBirth: { type: Date },
  avatar: { type: String, default: '' },
  // Doctor-specific
  specialization: { type: String, default: '' },
  licenseNumber: { type: String, default: '' },
  hospital: { type: String, default: '' },
  // Mother-specific
  pregnancyDueDate: { type: Date },
  pregnancyStartDate: { type: Date },
  isPostnatal: { type: Boolean, default: false },
  // Notification preferences
  notificationPrefs: {
    categories: { type: Map, of: Boolean, default: {} },
    channels: {
      browser: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
      email: { type: Boolean, default: false }
    }
  },
  // Sharing preferences (for mothers)
  sharingPrefs: {
    hydration: { type: Boolean, default: true },
    medicines: { type: Boolean, default: true },
    wellness: { type: Boolean, default: true },
    vaccinations: { type: Boolean, default: true },
    alerts: { type: Boolean, default: true },
    vitals: { type: Boolean, default: false },
    appointments: { type: Boolean, default: true }
  },
  lastLogin: { type: Date },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

export default mongoose.model('User', userSchema);
