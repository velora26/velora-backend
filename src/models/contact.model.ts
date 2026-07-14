import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'RESOLVED';
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: String,
  message: { type: String, required: true },
  status: { type: String, enum: ['UNREAD', 'READ', 'RESOLVED'], default: 'UNREAD' }
}, {
  timestamps: true
});

export const Contact = mongoose.model<IContact>('Contact', ContactSchema);
export default Contact;
