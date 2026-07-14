import BaseRepository from './base.repository';
import { Product, IProduct } from '../models/product.model';
import { Category } from '../models/category.model';
import { FilterQuery, Types } from 'mongoose';

export class ProductRepository extends BaseRepository<IProduct> {
  constructor() {
    super(Product);
  }

  async searchProducts(queryStr: string): Promise<IProduct[]> {
    return this.find(
      {
        $text: { $search: queryStr },
        status: 'ENABLED'
      },
      {
        sort: { score: { $meta: 'textScore' } }
      }
    );
  }

  async filterProducts(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    tags?: string;
    status?: 'ENABLED' | 'DISABLED';
    sort?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ products: IProduct[]; total: number }> {
    const query: FilterQuery<IProduct> = {};

    if (filters.status) {
      query.status = filters.status;
    } else {
      query.status = 'ENABLED';
    }

    let noResults = false;

    if (filters.category) {
      if (Types.ObjectId.isValid(filters.category)) {
        // Already a valid ObjectId (e.g. sent from the category filter dropdown)
        query.category = filters.category;
      } else {
        // A slug or name was passed instead (e.g. footer/nav links like
        // "?category=bracelets") -- resolve it to the actual category _id
        // instead of letting Mongoose throw a CastError (which surfaced as a
        // 500 Internal Server Error on GET /products).
        const matchedCategory = await Category.findOne({
          $or: [{ slug: filters.category.toLowerCase() }, { name: filters.category }]
        });
        if (matchedCategory) {
          query.category = matchedCategory._id;
        } else {
          // No matching category exists -- return an empty result set rather
          // than erroring out.
          noResults = true;
        }
      }
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }

    if (filters.rating !== undefined) {
      query.rating = { $gte: filters.rating };
    }

    if (filters.tags) {
      query.tags = { $in: filters.tags.split(',') };
    }

    // Sort mapping
    let sortObj: any = { createdAt: -1 }; // newest by default
    if (filters.sort === 'priceAsc') {
      sortObj = { price: 1 };
    } else if (filters.sort === 'priceDesc') {
      sortObj = { price: -1 };
    } else if (filters.sort === 'bestSelling') {
      sortObj = { rating: -1, numReviews: -1 };
    }

    if (noResults) {
      return { products: [], total: 0 };
    }

    const total = await this.count(query);
    const products = await this.find(query, {
      sort: sortObj,
      limit: filters.limit,
      skip: filters.skip,
      populate: 'category'
    });

    return { products, total };
  }

  async getRelatedProducts(productId: string, categoryId: string, limit = 4): Promise<IProduct[]> {
    return this.find(
      {
        category: categoryId,
        _id: { $ne: productId },
        status: 'ENABLED'
      },
      { limit }
    );
  }
}

export const productRepository = new ProductRepository();
export default productRepository;