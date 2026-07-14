import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminUser extends Document {
  user: mongoose.Types.ObjectId;
  accessLevel: 'SUPER' | 'MANAGER' | 'SUPPORT';
  lastActive: Date;
  status: 'ACTIVE' | 'INACTIVE';
}

const AdminUserSchema = new Schema<IAdminUser>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  accessLevel: { type: String, enum: ['SUPER', 'MANAGER', 'SUPPORT'], default: 'SUPER' },
  lastActive: { type: Date, default: Date.now },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
}, {
  timestamps: true
});

export const AdminUser = mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
export default AdminUser;
