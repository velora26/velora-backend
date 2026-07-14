import mongoose from 'mongoose';
import { orderRepository, offerRepository, productRepository, cartRepository, settingsRepository } from '../repositories/index';
import { OrderItem } from '../models/orderitem.model';
import { Product } from '../models/product.model';
import env from '../config/env';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Setup Razorpay client conditionally
let razorpay: any = null;
if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET
  });
}

export class CheckoutService {
  async calculateTotals(userId: string, couponCode?: string): Promise<{
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
    appliedOffer?: any;
  }> {
    // 1. Get cart
    const cart = await cartRepository.findOne({ user: userId }, { path: 'items.product', model: 'Product' });
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    let subtotal = 0;
    for (const item of cart.items) {
      const p = item.product as any;
      if (p.status !== 'ENABLED') throw new Error(`Product ${p.name} is no longer available`);
      const price = p.discountPrice || p.price;
      subtotal += price * item.quantity;
    }

    let discount = 0;
    let appliedOffer: any = undefined;

    if (couponCode) {
      const offer = await offerRepository.findOne({ code: couponCode, status: 'ACTIVE' });
      if (offer) {
        // Date checks
        const now = new Date();
        const startValid = !offer.startDate || offer.startDate <= now;
        const endValid = !offer.endDate || offer.endDate >= now;
        const minAmountValid = subtotal >= (offer.minAmount || 0);

        if (startValid && endValid && minAmountValid) {
          appliedOffer = offer;
          if (offer.type === 'PERCENTAGE') {
            discount = (subtotal * offer.value) / 100;
          } else if (offer.type === 'FLAT' || offer.type === 'FESTIVAL_SALE') {
            discount = offer.value;
          } else if (offer.type === 'CATEGORY_OFFER' && offer.category) {
            // Apply only to products in category
            let categorySubtotal = 0;
            for (const item of cart.items) {
              const p = item.product as any;
              if (p.category.toString() === offer.category.toString()) {
                categorySubtotal += (p.discountPrice || p.price) * item.quantity;
              }
            }
            discount = (categorySubtotal * offer.value) / 100;
          }
        }
      }
    }

    // Caps discount to subtotal
    discount = Math.min(discount, subtotal);

    // Shipping calculation dynamically loaded from website settings with product overrides
    let shipping = 0;
    try {
      let hasOverride = false;
      let maxOverride = 0;
      for (const item of cart.items) {
        const p = item.product as any;
        if (p.shippingPriceOverride !== undefined && p.shippingPriceOverride !== null && typeof p.shippingPriceOverride === 'number') {
          hasOverride = true;
          if (p.shippingPriceOverride > maxOverride) {
            maxOverride = p.shippingPriceOverride;
          }
        }
      }

      if (hasOverride) {
        shipping = maxOverride;
      } else {
        const settings = await settingsRepository.getSettings();
        if (settings.enableDeliveryCharge) {
          shipping = (subtotal - discount) >= settings.minOrderForFreeDelivery ? 0 : settings.deliveryChargeAmount;
        }
      }
    } catch (err) {
      // Fallback
      shipping = (subtotal - discount) > 500 ? 0 : 25;
    }
    
    const total = subtotal - discount + shipping;

    return { subtotal, discount, shipping, total, appliedOffer };
  }

  async createPaymentOrder(userId: string, data: { address: any; paymentMethod: 'Razorpay' | 'COD' | 'WhatsApp'; couponCode?: string }): Promise<any> {
    const totals = await this.calculateTotals(userId, data.couponCode);

    if (data.paymentMethod === 'COD' || data.paymentMethod === 'WhatsApp') {
      return { paymentMethod: data.paymentMethod, pricing: totals };
    }

    // Razorpay Flow
    const amountInPaise = Math.round(totals.total * 100);

    if (razorpay) {
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`
      });
      return {
        paymentMethod: 'Razorpay',
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        pricing: totals
      };
    } else {
      // Simulation mode
      const dummyId = `rzp_mock_${Math.random().toString(36).substring(2, 15)}`;
      return {
        paymentMethod: 'Razorpay',
        orderId: dummyId,
        amount: amountInPaise,
        currency: 'INR',
        pricing: totals,
        isSimulated: true
      };
    }
  }

  async verifyAndPlaceOrder(userId: string, data: {
    address: any;
    paymentMethod: 'Razorpay' | 'COD' | 'WhatsApp';
    couponCode?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }): Promise<any> {
    // NOTE: This does not use a MongoDB session/transaction, because
    // multi-document transactions require MongoDB to run as a replica set
    // (or mongos), which a plain standalone `mongod` does not support --
    // that mismatch is what causes "Transaction numbers are only allowed
    // on a replica set member or mongos". If you convert your MongoDB
    // deployment to a (single-node) replica set, prefer restoring the
    // session-based version for proper atomicity.
    //
    // Since we can't rely on an automatic transaction rollback here, we
    // track every write we make and manually undo them (best-effort) if
    // a later step fails.
    const stockDecrements: { productId: any; quantity: number }[] = [];
    const createdItemIds: mongoose.Types.ObjectId[] = [];
    let createdOrderId: any = null;

    const rollback = async () => {
      try {
        for (const dec of stockDecrements) {
          await Product.findByIdAndUpdate(dec.productId, { $inc: { stock: dec.quantity } });
        }
        if (createdItemIds.length > 0) {
          await OrderItem.deleteMany({ _id: { $in: createdItemIds } });
        }
        if (createdOrderId) {
          await orderRepository.delete(createdOrderId);
        }
      } catch (rollbackError) {
        console.error('Rollback failed after order placement error:', rollbackError);
      }
    };

    try {
      // 1. Get cart
      const cart = await cartRepository.findOne({ user: userId }, { path: 'items.product', model: 'Product' });
      if (!cart || cart.items.length === 0) throw new Error('Cart is empty');

      // 2. Validate stock and pricing
      const totals = await this.calculateTotals(userId, data.couponCode);

      // Verify signature if Razorpay was chosen
      if (data.paymentMethod === 'Razorpay' && razorpay) {
        if (!data.razorpayPaymentId || !data.razorpaySignature) {
          throw new Error('Payment verification data missing');
        }
        const text = `${data.razorpayOrderId}|${data.razorpayPaymentId}`;
        const generated_signature = crypto
          .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
          .update(text)
          .digest('hex');

        if (generated_signature !== data.razorpaySignature) {
          throw new Error('Payment signature verification failed');
        }
      }

      // 3. Create OrderItems
      for (const item of cart.items) {
        const p = item.product as any;

        // Deduct inventory
        const productDoc = await Product.findById(p._id);
        if (!productDoc || productDoc.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${p.name}`);
        }
        productDoc.stock -= item.quantity;
        await productDoc.save();
        stockDecrements.push({ productId: p._id, quantity: item.quantity });

        const orderItem = await OrderItem.create({
          product: p._id,
          name: p.name,
          quantity: item.quantity,
          price: p.discountPrice || p.price,
          image: p.images[0] || ''
        });

        createdItemIds.push(orderItem._id as mongoose.Types.ObjectId);
      }

      // 4. Create Order
      const newOrder = await orderRepository.create({
        user: userId as any,
        orderItems: createdItemIds,
        shippingAddress: data.address,
        paymentMethod: data.paymentMethod,
        pricingDetails: {
          subtotal: totals.subtotal,
          discount: totals.discount,
          shipping: totals.shipping,
          total: totals.total
        },
        orderStatus: 'Pending',
        isPaid: data.paymentMethod === 'Razorpay',
        paidAt: data.paymentMethod === 'Razorpay' ? new Date() : undefined,
        paymentResult: data.paymentMethod === 'Razorpay' ? {
          id: data.razorpayPaymentId,
          status: 'SUCCESS',
          update_time: new Date().toISOString()
        } : undefined
      });
      createdOrderId = newOrder._id;

      // 5. Clear Cart
      cart.items = [];
      await cart.save();

      // Create notifications for Admins
      try {
        const UserModel = mongoose.model('User');
        const NotificationModel = mongoose.model('Notification');
        const admins = await UserModel.find({ role: 'ADMIN' });
        
        const customerUser = await UserModel.findById(userId);
        const customerName = customerUser?.name || 'Customer';

        for (const admin of admins) {
          await NotificationModel.create({
            user: admin._id,
            title: 'New Order Placed',
            message: `Order ID #${newOrder._id} of amount ₹${totals.total.toFixed(2)} placed by ${customerName} via ${data.paymentMethod}.`
          });
        }
      } catch (notifyError) {
        console.error('Failed to create admin notifications:', notifyError);
      }

      return newOrder;
    } catch (error) {
      await rollback();
      throw error;
    }
  }

  async generateInvoiceHtml(orderId: string): Promise<string> {
    const order = await orderRepository.findById(orderId, [
      { path: 'orderItems', model: 'OrderItem' },
      { path: 'user', model: 'User' }
    ]);
    if (!order) throw new Error('Order not found');

    const itemsRows = (order.orderItems as any[]).map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order._id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 20px; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #bba35a; padding-bottom: 20px; }
          .title { font-size: 28px; color: #bba35a; font-weight: bold; }
          .info-table { width: 100%; margin-top: 20px; border-collapse: collapse; }
          .info-table td { padding: 5px; vertical-align: top; }
          .items-table { width: 100%; margin-top: 40px; border-collapse: collapse; }
          .items-table th { background: #f9f9f9; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
          .totals-table { width: 40%; margin-top: 20px; float: right; border-collapse: collapse; }
          .totals-table td { padding: 8px; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <span class="title">VELORA</span>
            <div>
              <strong>Order ID:</strong> ${order._id}<br>
              <strong>Date:</strong> ${order.createdAt.toLocaleDateString()}
            </div>
          </div>
          <table class="info-table">
            <tr>
              <td>
                <strong>Billed To:</strong><br>
                ${(order.user as any).name}<br>
                ${(order.user as any).email}
              </td>
              <td style="text-align: right;">
                <strong>Shipping Address:</strong><br>
                ${order.shippingAddress.fullName}<br>
                ${order.shippingAddress.addressLine}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
                Phone: ${order.shippingAddress.mobileNumber}
              </td>
            </tr>
          </table>
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
          <table class="totals-table">
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right;">₹${order.pricingDetails.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Discount:</td>
              <td style="text-align: right; color: red;">-₹${order.pricingDetails.discount.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Shipping:</td>
              <td style="text-align: right;">₹${order.pricingDetails.shipping.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 2px solid #bba35a; font-weight: bold;">
              <td>Total:</td>
              <td style="text-align: right;">₹${order.pricingDetails.total.toFixed(2)}</td>
            </tr>
          </table>
          <div style="clear: both; margin-top: 60px; font-size: 12px; color: #777; text-align: center;">
            Thank you for shopping with VELORA. For inquiries, email info@veloraboutique.com
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const checkoutService = new CheckoutService();
export default checkoutService;