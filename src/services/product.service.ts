import { productRepository } from '../repositories/product.repository';
import { categoryRepository } from '../repositories/index';
import { IProduct } from '../models/product.model';

export class ProductService {
  async getProductById(id: string): Promise<IProduct | null> {
    return productRepository.findById(id, 'category');
  }

  async getProductBySlug(slug: string): Promise<IProduct | null> {
    return productRepository.findOne({ slug, status: 'ENABLED' }, 'category');
  }

  async queryProducts(filters: any) {
    return productRepository.filterProducts(filters);
  }

  async getRelatedProducts(slug: string, limit = 4): Promise<IProduct[]> {
    const product = await productRepository.findOne({ slug });
    if (!product) throw new Error('Product not found');
    return productRepository.getRelatedProducts(
      product._id.toString(),
      product.category.toString(),
      limit
    );
  }

  async createProduct(data: any): Promise<IProduct> {
    // Generate unique slug
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existing = await productRepository.findOne({ slug });
    data.slug = existing ? `${slug}-${Date.now()}` : slug;

    // Validate Category
    const category = await categoryRepository.findById(data.category);
    if (!category) throw new Error('Invalid Category');

    return productRepository.create(data);
  }

  async updateProduct(id: string, data: any): Promise<IProduct | null> {
    if (data.name) {
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const existing = await productRepository.findOne({ slug, _id: { $ne: id } });
      data.slug = existing ? `${slug}-${Date.now()}` : slug;
    }

    if (data.category) {
      const category = await categoryRepository.findById(data.category);
      if (!category) throw new Error('Invalid Category');
    }

    return productRepository.update(id, data);
  }

  async deleteProduct(id: string): Promise<IProduct | null> {
    return productRepository.delete(id);
  }
}

export const productService = new ProductService();
export default productService;
