import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import env from '../config/env';
import {
  User,
  Category,
  Product,
  Banner,
  WebsiteSettings,
  Review,
  Order,
  OrderItem,
  ActivityLog,
  AdminUser
} from '../models/index';

const seedDatabase = async () => {
  try {
    console.log('Seeding database with premium Velora data...');
    await mongoose.connect(env.MONGODB_URI);

    // 1. Clear database collections
    await User.deleteMany({});
    await AdminUser.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Banner.deleteMany({});
    await WebsiteSettings.deleteMany({});
    await Review.deleteMany({});
    await Order.deleteMany({});
    await OrderItem.deleteMany({});
    await ActivityLog.deleteMany({});

    console.log('Database cleared.');

    // 2. Create Users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    const hashedCustomerPassword = await bcrypt.hash('customer123', salt);

    const admin = await User.create({
      name: 'Eleanor Vance',
      email: 'admin@velora.com',
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
      addresses: [
        {
          fullName: 'Eleanor Vance',
          mobileNumber: '9336896144',
          addressLine: 'Apt 4B, 220 Park Street',
          city: 'Kolkata',
          state: 'West Bengal',
          pincode: '700016',
          isDefault: true
        }
      ]
    });

    await AdminUser.create({
      user: admin._id,
      accessLevel: 'SUPER',
      status: 'ACTIVE'
    });

    const customer = await User.create({
      name: 'Julian Sterling',
      email: 'customer@velora.com',
      password: hashedCustomerPassword,
      role: 'CUSTOMER',
      isVerified: true,
      addresses: [
        {
          fullName: 'Julian Sterling',
          mobileNumber: '9876543210',
          addressLine: 'Flat 102, Fashion Avenue, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          isDefault: true
        }
      ]
    });

    console.log('Admin and Customer accounts created.');

    // 3. Create Categories
    const categoriesData = [
      {
        name: 'Bracelets',
        slug: 'bracelets',
        description: 'Elegantly crafted gold, silver, and gemstone cuffs and bands.',
        image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=800&auto=format&fit=crop',
        status: 'ENABLED' as const
      },
      {
        name: 'Rings',
        slug: 'rings',
        description: 'Timeless diamond statement bands and delicate stackables.',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop',
        status: 'ENABLED' as const
      },
      {
        name: 'Pendants',
        slug: 'pendants',
        description: 'Sculptural pendant necklaces hung from gold chains.',
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop',
        status: 'ENABLED' as const
      },
      {
        name: 'Keychains',
        slug: 'keychains',
        description: 'Exquisite brass and silver leather hardware ornaments.',
        image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop',
        status: 'ENABLED' as const
      },
      {
        name: 'Fashion Accessories',
        slug: 'fashion-accessories',
        description: 'Curated additions to complete a luxury wardrobe.',
        image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop',
        status: 'ENABLED' as const
      }
    ];

    const seededCategories = await Category.insertMany(categoriesData);
    console.log('Product categories seeded.');

    // Map categories by slug for quick lookup
    const catMap = seededCategories.reduce((acc: any, curr) => {
      acc[curr.slug] = curr._id;
      return acc;
    }, {});

    // 4. Create Products
    const productsData = [
      {
        name: 'Aurelia Gold Cuff',
        slug: 'aurelia-gold-cuff',
        description: 'A structural double-layered cuff bracelet dipped in 18k yellow gold. Smooth, polished mirror finish captures light beautifully.',
        category: catMap['bracelets'],
        price: 650,
        discountPrice: 450,
        images: [
          'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=800&auto=format&fit=crop'
        ],
        stock: 15,
        status: 'ENABLED' as const,
        tags: ['Featured Product' as const, 'Trending' as const],
        rating: 4.8,
        numReviews: 2
      },
      {
        name: 'Celestial Diamond Ring',
        slug: 'celestial-diamond-ring',
        description: 'A stellar diamond setting representing constellation alignments. Set with a 0.5-carat center brilliant-cut diamond in a platinum band.',
        category: catMap['rings'],
        price: 799,
        discountPrice: 599,
        images: [
          '/celestial-diamond-ring.jpg',
          'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=800&auto=format&fit=crop'
        ],
        stock: 8,
        status: 'ENABLED' as const,
        tags: ['Best Seller' as const, 'Featured Product' as const],
        rating: 5.0,
        numReviews: 1
      },
      {
        name: 'Luna Pearl Pendant',
        slug: 'luna-pearl-pendant',
        description: 'A glowing freshwater baroque pearl mounted in a hand-textured gold crescent. Includes an 18-inch adjustable cable link chain.',
        category: catMap['pendants'],
        price: 499,
        discountPrice: 349,
        images: [
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop'
        ],
        stock: 22,
        status: 'ENABLED' as const,
        tags: ['New Arrival' as const],
        rating: 4.7,
        numReviews: 3
      },
      {
        name: 'Vanguard Leather Valet',
        slug: 'vanguard-leather-valet',
        description: 'Premium full-grain Italian leather keychain paired with solid brass hardware loops. Debossed with the luxury Velora wordmark.',
        category: catMap['keychains'],
        price: 199,
        discountPrice: 149,
        images: [
          'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop'
        ],
        stock: 50,
        status: 'ENABLED' as const,
        tags: ['Trending' as const],
        rating: 4.5,
        numReviews: 1
      },
      {
        name: 'Versailles Crystal Hairpin',
        slug: 'versailles-crystal-hairpin',
        description: 'An ornate luxury hairpin studded with handset Swarovski crystals in floral leaf motifs. Gives standard evening wear an antique elegance.',
        category: catMap['fashion-accessories'],
        price: 349,
        discountPrice: 249,
        images: [
          'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop'
        ],
        stock: 30,
        status: 'ENABLED' as const,
        tags: ['New Arrival' as const],
        rating: 4.6,
        numReviews: 2
      }
    ];

    const seededProducts = await Product.insertMany(productsData);
    console.log('Premium products database populated.');

    // 5. Seed Banners
    const bannersData = [
      {
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1600&auto=format&fit=crop',
        title: 'THE SUMMER ECLIPSE COLLECTION',
        subtitle: 'Sculptural statements crafted in 18k solid gold and baroque pearls.',
        ctaText: 'Explore Collection',
        redirectUrl: '/shop?category=' + catMap['pendants'],
        status: 'ENABLED' as const
      },
      {
        image: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=1600&auto=format&fit=crop',
        title: 'CELESTIAL HARMONIES',
        subtitle: 'Discover diamond constellation bands that reflect stellar formations.',
        ctaText: 'Shop Rings',
        redirectUrl: '/shop?category=' + catMap['rings'],
        status: 'ENABLED' as const
      }
    ];
    await Banner.insertMany(bannersData);
    console.log('Homepage slider banners seeded.');

    // 6. Seed Default Settings
    await WebsiteSettings.create({
      websiteName: 'VELORA',
      email: 'concierge@veloraboutique.com',
      phone: '+91 9336896144',
      address: '742 Luxury Boulevard, Bandra West, Mumbai, Maharashtra 400050',
      socialLinks: {
        facebook: 'https://facebook.com/velora',
        instagram: 'https://instagram.com/velora',
        twitter: 'https://twitter.com/velora',
        pinterest: 'https://pinterest.com/velora'
      },
      brandStory: {
        storyText: 'Founded in 2026, Velora redefines modern high jewelry by blending architectural geometry with traditional, hand-textured craftsmanship.',
        missionText: 'To curate timeless accessories using ethically sourced fine metals and premium natural gemstones.',
        visionText: 'To be the ultimate luxury jewelry brand for individuals who value uniqueness and fine artistry.'
      },
      features: {
        wishlist: true,
        reviews: true,
        offers: true,
        featuredProducts: true,
        bestSellers: true,
        newArrivals: true
      }
    });
    console.log('Website settings initialized.');

    // 7. Seed Reviews
    const reviewsData = [
      {
        product: seededProducts[0]._id,
        user: customer._id,
        name: 'Julian S.',
        rating: 5,
        comment: 'Absolutely stunning gold cuff. The polish is clean and it fits my wrist perfectly. Excellent luxury packaging.',
        status: 'Approved' as const
      },
      {
        product: seededProducts[1]._id,
        user: customer._id,
        name: 'Julian S.',
        rating: 5,
        comment: 'A gorgeous setting. The diamond sparkles beautifully and the platinum weight feels premium.',
        status: 'Approved' as const
      }
    ];
    await Review.insertMany(reviewsData);
    console.log('Approved customer reviews seeded.');

    // 8. Seed Orders for Analytics (Timeline timeline data)
    const item1 = await OrderItem.create({
      product: seededProducts[0]._id,
      name: seededProducts[0].name,
      quantity: 1,
      price: 450,
      image: seededProducts[0].images[0]
    });

    const item2 = await OrderItem.create({
      product: seededProducts[2]._id,
      name: seededProducts[2].name,
      quantity: 2,
      price: 349,
      image: seededProducts[2].images[0]
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const order1 = await Order.create({
      user: customer._id,
      orderItems: [item1._id],
      shippingAddress: customer.addresses[0],
      paymentMethod: 'Razorpay',
      pricingDetails: {
        subtotal: 450,
        discount: 0,
        shipping: 40,
        total: 490
      },
      orderStatus: 'Delivered',
      isPaid: true,
      paidAt: yesterday,
      isDelivered: true,
      deliveredAt: yesterday,
      createdAt: yesterday
    });

    const order2 = await Order.create({
      user: customer._id,
      orderItems: [item2._id],
      shippingAddress: customer.addresses[0],
      paymentMethod: 'COD',
      pricingDetails: {
        subtotal: 698,
        discount: 50,
        shipping: 40,
        total: 688
      },
      orderStatus: 'Processing',
      isPaid: false,
      isDelivered: false
    });

    console.log('Mock sales history orders seeded for dashboards.');

    console.log('Database Seeding Successful!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

seedDatabase();