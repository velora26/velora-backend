import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { uploadService } from '../services/upload.service';

dotenv.config();

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const Product = mongoose.model(
  'Product',
  new mongoose.Schema({}, { strict: false, collection: 'products' })
);

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set in .env'); process.exit(1); }
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('Cloudinary credentials not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  const products = await Product.find({ images: { $regex: 'localhost' } });

  if (products.length === 0) {
    console.log('No products found with localhost image URLs. Nothing to fix.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${products.length} product(s) with broken localhost image URLs.\n`);

  for (const p of products as any[]) {
    const oldImages: string[] = p.images || [];
    const newImages: string[] = [];

    for (const oldUrl of oldImages) {
      const filename = oldUrl.split('/uploads/')[1];
      if (!filename) { console.log(`  Skipping unrecognized URL: ${oldUrl}`); continue; }

      const filePath = path.join(UPLOADS_DIR, filename);
      if (!fs.existsSync(filePath)) { console.log(`  File not found on disk, skipping: ${filename}`); continue; }

      const buffer = fs.readFileSync(filePath);
      const cloudinaryUrl = await uploadService.uploadImage(buffer, filename);
      newImages.push(cloudinaryUrl);
      console.log(`  Uploaded ${filename} -> ${cloudinaryUrl}`);
    }

    if (newImages.length > 0) {
      await Product.updateOne({ _id: p._id }, { $set: { images: newImages } });
      console.log(`Updated "${p.name}" with ${newImages.length} Cloudinary image(s)\n`);
    } else {
      console.log(`No valid local files found for "${p.name}" -- left unchanged\n`);
    }
  }

  console.log('Done.');
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });