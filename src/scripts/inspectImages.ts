import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const Product = mongoose.model(
  'Product',
  new mongoose.Schema({}, { strict: false, collection: 'products' })
);

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set in .env'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');
  console.log('Using database:', mongoose.connection.db?.databaseName, '\n');

  const names = [
    'Aurelia Gold Cuff',
    'Celestial Diamond Ring',
    'Luna Pearl Pendant',
    'Vanguard Leather Valet',
    'Versailles Crystal Hairpin',
  ];

  for (const name of names) {
    const p = await Product.findOne({ name });
    if (!p) {
      console.log(`"${name}" -> NOT FOUND in this database`);
      continue;
    }
    console.log(`"${name}"`);
    console.log('  images field:', JSON.stringify((p as any).images, null, 2));
    console.log('');
  }

  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });