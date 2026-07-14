import BaseRepository from './base.repository';
import { Order, IOrder } from '../models/order.model';
import { OrderItem } from '../models/orderitem.model';

export class OrderRepository extends BaseRepository<IOrder> {
  constructor() {
    super(Order);
  }

  async findByUserId(userId: string): Promise<IOrder[]> {
    return this.find(
      { user: userId },
      {
        sort: { createdAt: -1 },
        populate: {
          path: 'orderItems',
          model: 'OrderItem'
        }
      }
    );
  }

  async getDashboardStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    revenueGraph: { date: string; revenue: number }[];
    topProducts: { name: string; quantity: number; revenue: number }[];
  }> {
    // 1. Total revenue
    const revenueResult = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$pricingDetails.total' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // 2. Total orders
    const totalOrders = await this.count();

    // 3. Revenue timeline (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const graphResult = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          orderStatus: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$pricingDetails.total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const revenueGraph = graphResult.map(item => ({
      date: item._id,
      revenue: item.revenue
    }));

    // 4. Top selling products
    const topProductsResult = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $unwind: '$orderItems' },
      {
        $lookup: {
          from: 'orderitems',
          localField: 'orderItems',
          foreignField: '_id',
          as: 'item'
        }
      },
      { $unwind: '$item' },
      {
        $group: {
          _id: '$item.product',
          name: { $first: '$item.name' },
          quantity: { $sum: '$item.quantity' },
          revenue: { $sum: { $multiply: ['$item.price', '$item.quantity'] } }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 }
    ]);

    const topProducts = topProductsResult.map(item => ({
      name: item.name,
      quantity: item.quantity,
      revenue: item.revenue
    }));

    return {
      totalRevenue,
      totalOrders,
      revenueGraph,
      topProducts
    };
  }
}

export const orderRepository = new OrderRepository();
export default orderRepository;
