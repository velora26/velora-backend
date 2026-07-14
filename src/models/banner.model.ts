import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
  image: string;
  title: string;
  subtitle?: string;
  ctaText: string;
  redirectUrl: string;
  status: 'ENABLED' | 'DISABLED';
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>({
  image: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: String,
  ctaText: { type: String, default: 'Shop Now' },
  redirectUrl: { type: String, required: true },
  status: { type: String, enum: ['ENABLED', 'DISABLED'], default: 'ENABLED' }
}, {
  timestamps: true
});

export const Banner = mongoose.model<IBanner>('Banner', BannerSchema);
export default Banner;
