import { Router } from 'express';
import { protect, isAdmin } from '../middlewares/auth.middleware';
import { authLimiter } from '../middlewares/security.middleware';
import {
  authController,
  productController,
  categoryController,
  cartController,
  wishlistController,
  orderController,
  reviewController,
  offerController,
  bannerController,
  contactController,
  settingsController,
  adminDashboardController,
  notificationController,
  uploadController
} from '../controllers/index';

const router = Router();

// ==========================================
// AUTH ROUTES
// ==========================================
router.post('/auth/register', authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', protect, authController.logout);
router.get('/auth/verify-email/:token', authController.verifyEmail);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password/:token', authController.resetPassword);
router.get('/auth/profile', protect, authController.getProfile);
router.put('/auth/profile', protect, authController.updateProfile);
router.post('/auth/addresses', protect, authController.addAddress);
router.delete('/auth/addresses/:id', protect, authController.deleteAddress);

// ==========================================
// PRODUCT ROUTES
// ==========================================
router.get('/products', productController.getProducts);
router.get('/products/slug/:slug', productController.getProductBySlug);
router.get('/products/related/:slug', productController.getRelated);
router.post('/products', protect, isAdmin, productController.create);
router.put('/products/:id', protect, isAdmin, productController.update);
router.delete('/products/:id', protect, isAdmin, productController.delete);

// ==========================================
// CATEGORY ROUTES
// ==========================================
router.get('/categories', categoryController.getCategories);
router.post('/categories', protect, isAdmin, categoryController.create);
router.put('/categories/:id', protect, isAdmin, categoryController.update);
router.delete('/categories/:id', protect, isAdmin, categoryController.delete);

// ==========================================
// CART ROUTES
// ==========================================
router.get('/cart', protect, cartController.getCart);
router.post('/cart', protect, cartController.addToCart);
router.put('/cart/quantity', protect, cartController.updateQuantity);
router.delete('/cart/:productId', protect, cartController.removeFromCart);

// ==========================================
// WISHLIST ROUTES
// ==========================================
router.get('/wishlist', protect, wishlistController.getWishlist);
router.post('/wishlist', protect, wishlistController.toggle);
router.post('/wishlist/move-to-cart', protect, wishlistController.moveToCart);

// ==========================================
// ORDER / CHECKOUT ROUTES
// ==========================================
router.get('/orders/checkout-summary', protect, orderController.getCheckoutSummary);
router.post('/orders/payment', protect, orderController.createPayment);
router.post('/orders/place', protect, orderController.placeOrder);
router.get('/orders/my-orders', protect, orderController.getMyOrders);
router.get('/orders/:id', protect, orderController.getOrderById);
router.get('/orders/:id/invoice', protect, orderController.getInvoice);

// ==========================================
// REVIEWS ROUTES
// ==========================================
router.get('/reviews/product/:productId', reviewController.getReviews);
router.get('/reviews/featured', reviewController.getFeatured);
router.post('/reviews', protect, reviewController.create);

// ==========================================
// OFFERS ROUTES
// ==========================================
router.get('/offers', offerController.getOffers);
router.post('/offers', protect, isAdmin, offerController.create);
router.put('/offers/:id', protect, isAdmin, offerController.update);
router.delete('/offers/:id', protect, isAdmin, offerController.delete);

// ==========================================
// BANNERS ROUTES
// ==========================================
router.get('/banners', bannerController.getBanners);
router.get('/admin/banners', protect, isAdmin, bannerController.getAll);
router.post('/banners', protect, isAdmin, bannerController.create);
router.put('/banners/:id', protect, isAdmin, bannerController.update);
router.delete('/banners/:id', protect, isAdmin, bannerController.delete);

// ==========================================
// CONTACT / NEWSLETTER ROUTES
// ==========================================
router.post('/contacts', contactController.submitContact);
router.post('/newsletter/subscribe', contactController.subscribeNewsletter);

// ==========================================
// WEBSITE SETTINGS ROUTES
// ==========================================
router.get('/settings', settingsController.getSettings);
router.put('/settings', protect, isAdmin, settingsController.update);

// ==========================================
// ADMIN EXCLUSIVE MANAGEMENT ROUTES
// ==========================================
router.get('/admin/dashboard', protect, isAdmin, adminDashboardController.getOverview);
router.get('/admin/customers', protect, isAdmin, adminDashboardController.getCustomers);
router.put('/admin/customers/:id/block', protect, isAdmin, adminDashboardController.toggleBlockCustomer);
router.get('/admin/orders', protect, isAdmin, orderController.getAllOrders);
router.put('/admin/orders/:id/status', protect, isAdmin, orderController.updateStatus);
router.get('/admin/reviews', protect, isAdmin, reviewController.getAll);
router.put('/admin/reviews/:id/status', protect, isAdmin, reviewController.updateStatus);
router.delete('/admin/reviews/:id', protect, isAdmin, reviewController.delete);
router.get('/admin/contacts', protect, isAdmin, contactController.getMessages);
router.put('/admin/contacts/:id/status', protect, isAdmin, contactController.updateMessageStatus);
router.get('/admin/notifications', protect, isAdmin, notificationController.getNotifications);
router.put('/admin/notifications/:id/read', protect, isAdmin, notificationController.markAsRead);
router.post('/admin/upload', protect, isAdmin, uploadController.uploadImage);

export default router;