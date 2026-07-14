import mongoose, { Schema, Document } from 'mongoose';
import { IAddress, AddressSchema } from './user.model';

export interface IPricingDetails {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

export interface IPaymentResult {
  id?: string;
  status?: string;
  update_time?: string;
  email_address?: string;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderItems: mongoose.Types.ObjectId[];
  shippingAddress: IAddress;
  paymentMethod: 'Razorpay' | 'COD' | 'WhatsApp';
  paymentResult?: IPaymentResult;
  pricingDetails: IPricingDetails;
  orderStatus: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  isPaid: boolean;
  paidAt?: Date;
  isDelivered: boolean;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PricingDetailsSchema = new Schema<IPricingDetails>({
  subtotal: { type: Number, required: true, default: 0 },
  discount: { type: Number, required: true, default: 0 },
  shipping: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true, default: 0 }
});

const PaymentResultSchema = new Schema<IPaymentResult>({
  id: String,
  status: String,
  update_time: String,
  email_address: String
});

const OrderSchema = new Schema<IOrder>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  orderItems: [{ type: Schema.Types.ObjectId, ref: 'OrderItem', required: true }],
  shippingAddress: { type: AddressSchema, required: true },
  paymentMethod: { type: String, enum: ['Razorpay', 'COD', 'WhatsApp'], required: true },
  paymentResult: PaymentResultSchema,
  pricingDetails: { type: PricingDetailsSchema, required: true },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  isDelivered: { type: Boolean, default: false },
  deliveredAt: Date
}, {
  timestamps: true
});

OrderSchema.index({ user: 1 });
OrderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
