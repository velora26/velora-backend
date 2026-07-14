import mongoose, { Schema, Document } from 'mongoose';

export interface IFeatureToggles {
  wishlist: boolean;
  reviews: boolean;
  offers: boolean;
  featuredProducts: boolean;
  bestSellers: boolean;
  newArrivals: boolean;
}

export interface ISocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  pinterest?: string;
}

export interface IBrandStory {
  storyText: string;
  missionText: string;
  visionText: string;
}

export interface IWebsiteSettings extends Document {
  websiteName: string;
  logoUrl?: string;
  email: string;
  phone: string;
  address: string;
  socialLinks: ISocialLinks;
  brandStory: IBrandStory;
  features: IFeatureToggles;
  enableDeliveryCharge: boolean;
  deliveryChargeAmount: number;
  minOrderForFreeDelivery: number;
  estimatedShippingTime: string;
  enableReturnPolicy: boolean;
  returnPolicyNotice: string;
  returnPolicyDesc1: string;
  returnPolicyDesc2: string;
  returnPolicyDesc3: string;
  returnPolicyDesc4: string;
  createdAt: Date;
  updatedAt: Date;
}

const SocialLinksSchema = new Schema<ISocialLinks>({
  facebook: String,
  instagram: String,
  twitter: String,
  pinterest: String
}, { _id: false });

const BrandStorySchema = new Schema<IBrandStory>({
  storyText: { type: String, default: 'Velora is a luxury jewellery brand dedicated to crafting elegant accessories that transcend time.' },
  missionText: { type: String, default: 'To design high-quality, sustainable luxury jewelry that celebrates the beauty of every individual.' },
  visionText: { type: String, default: 'To become the leading global digital atelier for premium custom and handcrafted lifestyle ornaments.' }
}, { _id: false });

const FeatureTogglesSchema = new Schema<IFeatureToggles>({
  wishlist: { type: Boolean, default: true },
  reviews: { type: Boolean, default: true },
  offers: { type: Boolean, default: true },
  featuredProducts: { type: Boolean, default: true },
  bestSellers: { type: Boolean, default: true },
  newArrivals: { type: Boolean, default: true }
}, { _id: false });

const WebsiteSettingsSchema = new Schema<IWebsiteSettings>({
  websiteName: { type: String, default: 'VELORA' },
  logoUrl: String,
  email: { type: String, default: 'info@veloraboutique.com' },
  phone: { type: String, default: '+1 (555) 019-2834' },
  address: { type: String, default: '742 Luxury Boulevard, Fashion District, NY 10001' },
  socialLinks: { type: SocialLinksSchema, default: {} },
  brandStory: { type: BrandStorySchema, default: {} },
  features: { type: FeatureTogglesSchema, default: {} },
  enableDeliveryCharge: { type: Boolean, default: true },
  deliveryChargeAmount: { type: Number, default: 25 },
  minOrderForFreeDelivery: { type: Number, default: 500 },
  estimatedShippingTime: { type: String, default: '2-5 Business Days' },
  enableReturnPolicy: { type: Boolean, default: true },
  returnPolicyNotice: { type: String, default: 'No refund, no return available' },
  returnPolicyDesc1: { type: String, default: 'Imitation jewellery items are fragile and cannot be returned after shipping.' },
  returnPolicyDesc2: { type: String, default: 'We inspect all pieces for quality assurance before packaging.' },
  returnPolicyDesc3: { type: String, default: 'In case of damage during transit, please contact support within 24 hours with package opening video.' },
  returnPolicyDesc4: { type: String, default: 'All custom order requests are final and cannot be cancelled once processed.' }
}, {
  timestamps: true
});

export const WebsiteSettings = mongoose.model<IWebsiteSettings>('WebsiteSettings', WebsiteSettingsSchema);
export default WebsiteSettings;
