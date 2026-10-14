import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  read: { type: Boolean, default: false },
  actionUrl: { type: String, default: '' },
  relatedTo: { type: mongoose.Schema.Types.ObjectId },
  relatedModel: { type: String }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
