import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

// Groups of new images -- cycled across whatever products carry the
// homepage tags below. Edit filenames/order if you want specific images
// on specific products.
const IMAGE_GROUPS: string[][] = [
  ['no85-jhumka-black-floral-1.jpeg', 'no85-jhumka-black-floral-2.jpeg'],
  ['no145-jhumka-kundan-maroon-1.jpeg', 'no145-jhumka-kundan-mint-2.jpeg'],
  ['no175-chandbali-grey-beads-1.jpeg', 'no175-chandbali-teal-beads-2.jpeg', 'no175-chandbali-mint-beads-3.jpeg'],
  ['pearl-station-necklace-styled.jpeg', 'pearl-station-necklace-raw.jpeg'],
  ['cz-bridal-necklace-set-model-1.jpeg', 'cz-bridal-necklace-set-model-2.jpeg'],
  ['antique-cz-interchangeable-set.jpeg'],
  ['antique-kundan-ruby-emerald-set-1.jpeg', 'antique-kundan-ruby-emerald-set-2.jpeg'],
  ['gold-vintage-pendant-hand.jpeg'],
  ['heritage-finger-ring-i9.jpeg'],
];

const HOMEPAGE_TAGS = ['New Arrival', 'Trending', 'Best Seller', 'Featured Product'];

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

  const products = await Product.find({ tags: { $in: HOMEPAGE_TAGS } });

  if (products.length === 0) {
    console.log('No products found with tags:', HOMEPAGE_TAGS.join(', '));
    console.log('Check that your Product documents actually have a `tags` array containing these exact strings.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${products.length} product(s) with homepage tags.\n`);

  for (let i = 0; i < products.length; i++) {
    const p: any = products[i];
    const group = IMAGE_GROUPS[i % IMAGE_GROUPS.length];
    const newImages = group.map((f) => `${BACKEND_URL}/uploads/${f}`);

    await Product.updateOne({ _id: p._id }, { $set: { images: newImages } });
    console.log(`Updated "${p.name}" (tags: ${JSON.stringify(p.tags)}) -> ${newImages.length} image(s)`);
  }

  console.log(`\nDone. ${products.length} product(s) updated.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});