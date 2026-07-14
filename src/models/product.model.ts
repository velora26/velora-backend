import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  category: mongoose.Types.ObjectId;
  price: number;
  discountPrice?: number;
  images: string[];
  stock: number;
  status: 'ENABLED' | 'DISABLED';
  tags: ('Trending' | 'New Arrival' | 'Best Seller' | 'Featured Product')[];
  rating: number;
  numReviews: number;
  descriptionBox1?: string;
  descriptionBox2?: string;
  shippingTimeOverride?: string;
  shippingPriceOverride?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, min: 0 },
  images: { type: [String], default: [] },
  stock: { type: Number, required: true, min: 0, default: 0 },
  status: { type: String, enum: ['ENABLED', 'DISABLED'], default: 'ENABLED' },
  tags: {
    type: [String],
    enum: ['Trending', 'New Arrival', 'Best Seller', 'Featured Product'],
    default: []
  },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  descriptionBox1: { type: String, default: '' },
  descriptionBox2: { type: String, default: '' },
  shippingTimeOverride: { type: String, default: '' },
  shippingPriceOverride: { type: Number }
}, {
  timestamps: true
});

// Text index for search system
ProductSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text'
}, {
  weights: {
    name: 10,
    tags: 5,
    description: 1
  },
  name: 'ProductTextSearchIndex'
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
export default Product;
