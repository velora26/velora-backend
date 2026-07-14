import { Model, Document, FilterQuery, UpdateQuery, PopulateOptions } from 'mongoose';

export class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(item: Partial<T> | any): Promise<T> {
    return this.model.create(item);
  }

  async findById(id: string, populate?: string | PopulateOptions | (string | PopulateOptions)[]): Promise<T | null> {
    let query = this.model.findById(id);
    if (populate) {
      query = query.populate(populate as any);
    }
    return query.exec();
  }

  async findOne(
    filter: FilterQuery<T>,
    populate?: string | PopulateOptions | (string | PopulateOptions)[]
  ): Promise<T | null> {
    let query = this.model.findOne(filter);
    if (populate) {
      query = query.populate(populate as any);
    }
    return query.exec();
  }

  async find(
    filter: FilterQuery<T> = {},
    options: {
      sort?: any;
      limit?: number;
      skip?: number;
      populate?: string | PopulateOptions | (string | PopulateOptions)[];
    } = {}
  ): Promise<T[]> {
    let query = this.model.find(filter);
    
    if (options.sort) {
      query = query.sort(options.sort);
    }
    if (options.skip) {
      query = query.skip(options.skip);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.populate) {
      query = query.populate(options.populate as any);
    }

    return query.exec();
  }

  async update(id: string, item: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, item, { new: true, runValidators: true }).exec();
  }

  async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }
}

export default BaseRepository;
