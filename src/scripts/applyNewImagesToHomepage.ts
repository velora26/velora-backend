import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { uploadService } from '../services/upload.service';

dotenv.config();

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const IMAGE_GROUPS: string[][] = [
  ['no85-jhumka-black-floral-1.jpeg', 'no85-jhumka-black-floral-2.jpeg'],
  ['no145-jhumka-kundan-maroon-1.jpeg', 'no145-jhumka-kundan-mint-2.jpeg'],
  ['no175-chandbali-grey-beads-1.jpeg', 'no175-chandbali-teal-beads-2.jpeg', 'no175-chandbali-mint-beads-3.jpeg'],
  ['pearl-station-necklace-styled.jpeg', 'pearl-station-necklace-raw.jpeg'],
  ['cz-bridal-necklace-set-model-1.jpeg', 'cz-bridal-necklace-set-model-2.jpeg'],
];

const HOMEPAGE_TAGS = ['New Arrival', 'Trending', 'Best Seller', 'Featured Product'];

const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false, collection: 'products' }));

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set in .env'); process.exit(1); }
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('Cloudinary credentials not set in .env'); process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  const products = await Product.find({ tags: { $in: HOMEPAGE_TAGS } });
  if (products.length === 0) {
    console.log('No products found with homepage tags.');
    await mongoose.disconnect();
    return;
  }
  console.log(`Found ${products.length} product(s) with homepage tags.\n`);

  for (let i = 0; i < products.length; i++) {
    const p: any = products[i];
    const group = IMAGE_GROUPS[i % IMAGE_GROUPS.length];
    const newImages: string[] = [];

    for (const filename of group) {
      const filePath = path.join(UPLOADS_DIR, filename);
      if (!fs.existsSync(filePath)) {
        console.log(`  File not found, skipping: ${filename}`);
        continue;
      }
      const buffer = fs.readFileSync(filePath);
      const cloudinaryUrl = await uploadService.uploadImage(buffer, filename);
      newImages.push(cloudinaryUrl);
      console.log(`  Uploaded ${filename} -> ${cloudinaryUrl}`);
    }

    if (newImages.length > 0) {
      await Product.updateOne({ _id: p._id }, { $set: { images: newImages } });
      console.log(`Updated "${p.name}" -> ${newImages.length} image(s)\n`);
    }
  }

  console.log('Done.');
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });