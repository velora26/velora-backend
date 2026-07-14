import mongoose, { Schema, Document } from 'mongoose';

export interface IOffer extends Document {
  title: string;
  code: string;
  description?: string;
  type: 'PERCENTAGE' | 'FLAT' | 'FESTIVAL_SALE' | 'CATEGORY_OFFER';
  value: number; // percentage or amount
  category?: mongoose.Types.ObjectId; // applies to specific category if provided
  minAmount?: number;
  status: 'ACTIVE' | 'INACTIVE';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>({
  title: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: String,
  type: {
    type: String,
    enum: ['PERCENTAGE', 'FLAT', 'FESTIVAL_SALE', 'CATEGORY_OFFER'],
    required: true
  },
  value: { type: Number, required: true, min: 0 },
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  minAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  startDate: { type: Date, default: Date.now },
  endDate: Date
}, {
  timestamps: true
});

OfferSchema.index({ code: 1, status: 1 });

export const Offer = mongoose.model<IOffer>('Offer', OfferSchema);
export default Offer;
