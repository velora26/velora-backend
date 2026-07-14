import { orderRepository, productRepository, categoryRepository, userRepository, reviewRepository, offerRepository, activityLogRepository } from '../repositories/index';
import { Order } from '../models/order.model';
import { User } from '../models/user.model';

export class AdminDashboardService {
  async getOverviewStats(): Promise<any> {
    const orderStats = await orderRepository.getDashboardStats();
    
    const totalProducts = await productRepository.count();
    const totalCategories = await categoryRepository.count();
    const totalCustomers = await userRepository.count({ role: 'CUSTOMER' });
    const totalReviews = await reviewRepository.count();
    const activeOffers = await offerRepository.count({ status: 'ACTIVE' });

    // Calculate orders received today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const ordersToday = await orderRepository.count({
      createdAt: { $gte: startOfToday }
    });

    // Recent activities (last 10 items)
    const recentActivities = await activityLogRepository.find({}, {
      limit: 10,
      sort: { createdAt: -1 },
      populate: { path: 'user', select: 'name email role' }
    });

    // Order status breakdown
    const statusStats = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);
    const orderStatusDistribution = statusStats.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.count;
      return acc;
    }, { Pending: 0, Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 });

    // Customer registrations over time (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const customerGraph = await User.aggregate([
      {
        $match: {
          role: 'CUSTOMER',
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    const customerTrend = customerGraph.map(item => ({
      date: item._id,
      registrations: item.count
    }));

    return {
      revenue: orderStats.totalRevenue,
      orders: orderStats.totalOrders,
      ordersToday,
      products: totalProducts,
      categories: totalCategories,
      customers: totalCustomers,
      reviews: totalReviews,
      offers: activeOffers,
      revenueGraph: orderStats.revenueGraph,
      topProducts: orderStats.topProducts,
      orderStatusDistribution,
      customerTrend,
      recentActivities
    };
  }
}

export const adminDashboardService = new AdminDashboardService();
export default adminDashboardService;
