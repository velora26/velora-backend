import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const Category = mongoose.model(
  'Category',
  new mongoose.Schema({}, { strict: false, collection: 'categories' })
);

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  const categories = await Category.find({}, 'name image slug');

  if (categories.length === 0) {
    console.log('No categories found.');
  } else {
    categories.forEach((c: any) => {
      console.log(`${c.name}  (slug: ${c.slug})  ->  ${c.image}`);
    });
    console.log(`\nTotal: ${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});