import { cartRepository, wishlistRepository, productRepository } from '../repositories/index';
import { ICart } from '../models/cart.model';
import { IWishlist } from '../models/wishlist.model';

export class CartWishlistService {
  // --- Cart Operations ---
  async getCart(userId: string): Promise<ICart> {
    let cart = await cartRepository.findOne({ user: userId }, { path: 'items.product', model: 'Product' });
    if (!cart) {
      cart = await cartRepository.create({ user: userId, items: [] });
    }
    return cart;
  }

  async addToCart(userId: string, productId: string, quantity = 1): Promise<ICart> {
    const product = await productRepository.findById(productId);
    if (!product) throw new Error('Product not found');
    if (product.stock < quantity) throw new Error('Requested quantity exceeds stock');

    const cart = await this.getCart(userId);
    const existingIndex = cart.items.findIndex(item => item.product._id.toString() === productId);

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
      if (product.stock < cart.items[existingIndex].quantity) {
        throw new Error('Total quantity exceeds stock availability');
      }
    } else {
      cart.items.push({ product: productId as any, quantity });
    }

    await cart.save();
    return this.getCart(userId);
  }

  async updateCartQuantity(userId: string, productId: string, quantity: number): Promise<ICart> {
    const product = await productRepository.findById(productId);
    if (!product) throw new Error('Product not found');
    if (product.stock < quantity) throw new Error('Requested quantity exceeds stock');

    const cart = await this.getCart(userId);
    const existingIndex = cart.items.findIndex(item => item.product._id.toString() === productId);

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = quantity;
      await cart.save();
    }
    return this.getCart(userId);
  }

  async removeFromCart(userId: string, productId: string): Promise<ICart> {
    const cart = await this.getCart(userId);
    cart.items = cart.items.filter(item => item.product._id.toString() !== productId);
    await cart.save();
    return this.getCart(userId);
  }

  // --- Wishlist Operations ---
  async getWishlist(userId: string): Promise<IWishlist> {
    let wishlist = await wishlistRepository.findOne({ user: userId }, 'products');
    if (!wishlist) {
      wishlist = await wishlistRepository.create({ user: userId, products: [] });
    }
    return wishlist;
  }

  async toggleWishlist(userId: string, productId: string): Promise<IWishlist> {
    const product = await productRepository.findById(productId);
    if (!product) throw new Error('Product not found');

    const wishlist = await this.getWishlist(userId);
    const index = wishlist.products.findIndex(p => p.toString() === productId);

    if (index > -1) {
      wishlist.products.splice(index, 1);
    } else {
      wishlist.products.push(productId as any);
    }

    await wishlist.save();
    return this.getWishlist(userId);
  }

  async moveToCart(userId: string, productId: string): Promise<{ cart: ICart; wishlist: IWishlist }> {
    // 1. Remove from wishlist
    const wishlist = await this.getWishlist(userId);
    wishlist.products = wishlist.products.filter(p => p.toString() !== productId);
    await wishlist.save();

    // 2. Add to cart
    const cart = await this.addToCart(userId, productId, 1);

    return { cart, wishlist };
  }
}

export const cartWishlistService = new CartWishlistService();
export default cartWishlistService;
