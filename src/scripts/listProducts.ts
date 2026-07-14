import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const Product = mongoose.model(
  'Product',
  new mongoose.Schema({}, { strict: false, collection: 'products' })
);

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  const products = await Product.find({}, 'name images').limit(50);

  if (products.length === 0) {
    console.log('No products found in the "products" collection.');
  } else {
    products.forEach((p: any) => {
      console.log(`${p.name}  ->  ${JSON.stringify(p.images)}`);
    });
    console.log(`\nTotal: ${products.length} product(s)`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});