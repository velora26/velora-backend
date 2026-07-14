import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress {
  _id?: any;
  fullName: string;
  mobileNumber: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'CUSTOMER' | 'ADMIN';
  isVerified: boolean;
  addresses: IAddress[];
  emailVerificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const AddressSchema = new Schema<IAddress>({
  fullName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  addressLine: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false },
  role: { type: String, enum: ['CUSTOMER', 'ADMIN'], default: 'CUSTOMER' },
  isVerified: { type: Boolean, default: false },
  addresses: [AddressSchema],
  emailVerificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  refreshToken: String
}, {
  timestamps: true
});

// Indexing for performance

export const User = mongoose.model<IUser>('User', UserSchema);
export default User;
