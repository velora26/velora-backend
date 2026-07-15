import mongoose, { Schema, Document } from 'mongoose';

// Stores uploaded images directly in MongoDB instead of relying on a
// third-party storage service (Cloudinary, S3, etc.) or local disk.
// Local disk doesn't work on Vercel (its filesystem is read-only and
// non-persistent for deployed functions), so the image bytes live here
// and get served back out through GET /api/images/:id.
export interface IImage extends Document {
  filename: string;
  contentType: string;
  data: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = new Schema<IImage>({
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  data: { type: Buffer, required: true }
}, {
  timestamps: true
});

export const Image = mongoose.model<IImage>('Image', ImageSchema);
export default Image;