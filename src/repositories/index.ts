import BaseRepository from './base.repository';
import { Category, ICategory } from '../models/category.model';
import { Review, IReview } from '../models/review.model';
import { Wishlist, IWishlist } from '../models/wishlist.model';
import { Cart, ICart } from '../models/cart.model';
import { Offer, IOffer } from '../models/offer.model';
import { Banner, IBanner } from '../models/banner.model';
import { Contact, IContact } from '../models/contact.model';
import { NewsletterSubscriber, INewsletterSubscriber } from '../models/newsletter.model';
import { WebsiteSettings, IWebsiteSettings } from '../models/settings.model';
import { Notification, INotification } from '../models/notification.model';
import { ActivityLog, IActivityLog } from '../models/activity.model';

// Re-export specific repositories
export { userRepository, UserRepository } from './user.repository';
export { productRepository, ProductRepository } from './product.repository';
export { orderRepository, OrderRepository } from './order.repository';

// Define remaining repositories
export class CategoryRepository extends BaseRepository<ICategory> {
  constructor() {
    super(Category);
  }
}

export class ReviewRepository extends BaseRepository<IReview> {
  constructor() {
    super(Review);
  }
}

export class WishlistRepository extends BaseRepository<IWishlist> {
  constructor() {
    super(Wishlist);
  }
}

export class CartRepository extends BaseRepository<ICart> {
  constructor() {
    super(Cart);
  }
}

export class OfferRepository extends BaseRepository<IOffer> {
  constructor() {
    super(Offer);
  }
}

export class BannerRepository extends BaseRepository<IBanner> {
  constructor() {
    super(Banner);
  }
}

export class ContactRepository extends BaseRepository<IContact> {
  constructor() {
    super(Contact);
  }
}

export class NewsletterRepository extends BaseRepository<INewsletterSubscriber> {
  constructor() {
    super(NewsletterSubscriber);
  }
}

export class SettingsRepository extends BaseRepository<IWebsiteSettings> {
  constructor() {
    super(WebsiteSettings);
  }

  async getSettings(): Promise<IWebsiteSettings> {
    let settings = await this.findOne({});
    if (!settings) {
      settings = await this.create({});
    }
    return settings;
  }
}

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification);
  }
}

export class ActivityLogRepository extends BaseRepository<IActivityLog> {
  constructor() {
    super(ActivityLog);
  }
}

// Singletons
export const categoryRepository = new CategoryRepository();
export const reviewRepository = new ReviewRepository();
export const wishlistRepository = new WishlistRepository();
export const cartRepository = new CartRepository();
export const offerRepository = new OfferRepository();
export const bannerRepository = new BannerRepository();
export const contactRepository = new ContactRepository();
export const newsletterRepository = new NewsletterRepository();
export const settingsRepository = new SettingsRepository();
export const notificationRepository = new NotificationRepository();
export const activityLogRepository = new ActivityLogRepository();
