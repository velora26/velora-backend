import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// ---- EDIT THIS MAPPING to match your real product names ----
const IMAGE_MAP: Record<string, string[]> = {
  'jhumka 85': ['no85-jhumka-black-floral-1.jpeg', 'no85-jhumka-black-floral-2.jpeg'],
  'jhumka 145': ['no145-jhumka-kundan-maroon-1.jpeg', 'no145-jhumka-kundan-mint-2.jpeg'],
  'chandbali 175': [
    'no175-chandbali-grey-beads-1.jpeg',
    'no175-chandbali-teal-beads-2.jpeg',
    'no175-chandbali-mint-beads-3.jpeg',
  ],
  'pearl station necklace': ['pearl-station-necklace-styled.jpeg', 'pearl-station-necklace-raw.jpeg'],
  'bridal necklace set': ['cz-bridal-necklace-set-model-1.jpeg', 'cz-bridal-necklace-set-model-2.jpeg'],
  'interchangeable necklace set': ['antique-cz-interchangeable-set.jpeg'],
  'kundan ruby emerald set': ['antique-kundan-ruby-emerald-set-1.jpeg', 'antique-kundan-ruby-emerald-set-2.jpeg'],
  'vintage gold pendant': ['gold-vintage-pendant-hand.jpeg'],
  'heritage finger ring': ['heritage-finger-ring-i9.jpeg'],
};
// ---------------------------------------------------------------

const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false, collection: 'products' }));

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set in .env'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  let updatedCount = 0;
  const notFound: string[] = [];

  for (const [matchText, filenames] of Object.entries(IMAGE_MAP)) {
    const newImages = filenames.map((f) => `${BACKEND_URL}/uploads/${f}`);

    const result = await Product.updateMany(
      { name: { $regex: matchText, $options: 'i' } }, // case-insensitive partial match on name
      { $set: { images: newImages } }
    );

    if (result.matchedCount === 0) notFound.push(matchText);
    else {
      updatedCount += result.modifiedCount;
      console.log(`Updated "${matchText}" -> ${result.modifiedCount} product(s)`);
    }
  }

  console.log(`\nDone. ${updatedCount} product(s) updated.`);
  if (notFound.length) {
    console.log(`\nNo product matched these — check your real product names in the DB:`);
    notFound.forEach((n) => console.log(`  - "${n}"`));
  }

  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });