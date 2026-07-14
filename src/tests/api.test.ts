import request from 'supertest';
import mongoose from 'mongoose';
import app, { server } from '../index';
import { User } from '../models/user.model';
import { Category } from '../models/category.model';
import { Product } from '../models/product.model';

describe('VELORA API Integration Tests', () => {
  let adminToken = '';
  let customerToken = '';
  let categoryId = '';
  let productId = '';

  beforeAll(async () => {
    // Clear and prepare test environment
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
  });

  afterAll(async () => {
    // Clean up connections
    await mongoose.connection.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  describe('Auth Endpoints', () => {
    it('should register a new customer', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@test.com',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      customerToken = res.body.data.token;
    });

    it('should login the customer', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@test.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should fetch user profile', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('jane@test.com');
    });
  });

  describe('Product Catalog Endpoints', () => {
    it('should allow admin to create a category', async () => {
      // First register and promote an admin user
      const adminRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Admin User',
          email: 'admin_test@test.com',
          password: 'adminpassword'
        });

      await User.findOneAndUpdate({ email: 'admin_test@test.com' }, { role: 'ADMIN' });
      
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin_test@test.com',
          password: 'adminpassword'
        });

      adminToken = loginRes.body.data.token;

      const categoryRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Necklaces',
          description: 'Luxury Necklaces'
        });

      expect(categoryRes.status).toBe(201);
      expect(categoryRes.body.success).toBe(true);
      categoryId = categoryRes.body.data._id;
    });

    it('should allow admin to create a product', async () => {
      const productRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Gilded Chain Necklace',
          description: 'A delicate necklace dipped in gold.',
          category: categoryId,
          price: 150,
          stock: 10
        });

      expect(productRes.status).toBe(201);
      expect(productRes.body.success).toBe(true);
      productId = productRes.body.data._id;
    });

    it('should retrieve catalog products', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products.length).toBeGreaterThan(0);
    });
  });

  describe('Shopping Cart and Wishlist', () => {
    it('should add item to cart', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId,
          quantity: 2
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items[0].product._id).toBe(productId);
      expect(res.body.data.items[0].quantity).toBe(2);
    });

    it('should get checkout summary calculations', async () => {
      const res = await request(app)
        .get('/api/orders/checkout-summary')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subtotal).toBe(300); // 150 * 2
      expect(res.body.data.total).toBe(325); // subtotal 300 + 25 shipping
    });
  });
});
