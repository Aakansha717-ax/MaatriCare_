import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  motherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grantedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grantedToRole: { type: String, enum: ['guardian', 'doctor'], required: true },
  sharedItems: [{ type: String }],
  inviteCode: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['pending', 'accepted', 'revoked'], default: 'pending' },
  consentDate: { type: Date }
}, { timestamps: true });

export default mongoose.model('Permission', permissionSchema);
