// import express from 'express';
// import cors from 'cors';
// import helmet from 'helmet';
// import cookieParser from 'cookie-parser';
// import mongoSanitize from 'express-mongo-sanitize';
// import path from 'path';
// import fs from 'fs';
// import connectDB from './config/db';
// import env from './config/env';
// import router from './routes/index';
// import { apiLimiter, sanitizeRequest } from './middlewares/security.middleware';
// import errorHandler from './middlewares/error.middleware';

// const app = express();

// // Connect Database
// connectDB();

// // // Ensure uploads folder exists
// // const uploadsDir = path.join(__dirname, '../uploads');
// // if (!fs.existsSync(uploadsDir)) {
// //   fs.mkdirSync(uploadsDir, { recursive: true });
// // }

// // Ensure uploads folder exists (skipped on Vercel -- its filesystem is
// // read-only outside /tmp, so this write would throw and crash the function
// // on every cold start; local disk storage isn't used in production anyway
// // now that uploads go through Cloudinary, see services/upload.service.ts)
// const uploadsDir = path.join(__dirname, '../uploads');
// if (!process.env.VERCEL && !fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// // Security HTTP Headers
// // Note: crossOriginResourcePolicy must be relaxed to 'cross-origin', otherwise
// // the browser blocks images served from /uploads when the frontend runs on a
// // different port/origin (e.g. frontend on :3001, backend on :5000) -- this is
// // what causes freshly-uploaded admin product images to appear broken.
// app.use(helmet({
//   crossOriginResourcePolicy: { policy: 'cross-origin' }
// }));

// // // CORS Configuration
// // const allowedOrigins = [
// //   env.CLIENT_URL,
// //   'http://localhost:5173',
// //   'http://127.0.0.1:5173',
// //   'https://velora-frontend.vercel.app',
// // ];

// // app.use(cors({
// //   origin: (origin, callback) => {
// //     if (!origin || allowedOrigins.includes(origin)) {
// //       callback(null, true);
// //     } else {
// //       callback(new Error('Not allowed by CORS'));
// //     }
// //   },
// //   credentials: true,
// //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
// // }));

// // CORS Configuration
// const allowedOrigins = [
//   env.CLIENT_URL,
//   'http://localhost:5173',
//   'http://127.0.0.1:5173',
// ];

// // Vercel gives a frontend project multiple valid URLs: a short production
// // alias (e.g. velora-frontend-chi.vercel.app) and a long per-deployment
// // hash URL (e.g. velora-frontend-670nvza22-juhii07s-projects.vercel.app)
// // that changes on every deploy. This pattern matches any *.vercel.app
// // subdomain starting with "velora-frontend", covering both shapes.
// const vercelProjectPattern = /^https:\/\/velora-frontend[a-z0-9-]*\.vercel\.app$/;

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin) || vercelProjectPattern.test(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
// }));

// // Body parsers
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// app.use(cookieParser());

// // Serve static uploads
// app.use('/uploads', express.static(uploadsDir));

// // Sanitize data against NoSQL query injection
// app.use(mongoSanitize());

// // Custom xss / input sanitizer middleware
// app.use(sanitizeRequest);

// // Rate Limiter
// app.use('/api', apiLimiter);

// // Health Check
// app.get('/health', (req, res) => {
//   res.status(200).json({ success: true, message: 'Velora Backend Server is healthy' });
// });

// // Mounting Router
// app.use('/api', router);

// // Global Error Handler Middleware
// app.use(errorHandler);

// // // Start Server
// // const server = app.listen(env.PORT, () => {
// //   console.log(`Velora Backend running in ${env.NODE_ENV} mode on port ${env.PORT}`);
// // });

// // Start Server (skipped on Vercel -- its serverless runtime imports
// // the exported `app` directly and handles the HTTP listening itself)
// let server: import('http').Server | undefined;
// if (!process.env.VERCEL) {
//   server = app.listen(env.PORT, () => {
//     console.log(`Velora Backend running in ${env.NODE_ENV} mode on port ${env.PORT}`);
//   });
// }

// export { app, server };
// export default app;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import fs from 'fs';
import connectDB from './config/db';
import env from './config/env';
import router from './routes/index';
import { apiLimiter, sanitizeRequest } from './middlewares/security.middleware';
import errorHandler from './middlewares/error.middleware';

const app = express();

// Connect Database
// NOTE: this used to be a fire-and-forget `connectDB();` call -- on Vercel,
// a cold start could then start handling a request before the connection
// had actually finished, which is a likely cause of intermittent 500s.
// ensureDbConnected below makes every request actually wait for the
// (cached) connection first.
const ensureDbConnected = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (error: any) {
    res.status(503).json({
      success: false,
      error: 'Database connection failed. Please try again in a moment.'
    });
  }
};

// // Ensure uploads folder exists
// const uploadsDir = path.join(__dirname, '../uploads');
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// Ensure uploads folder exists (skipped on Vercel -- its filesystem is
// read-only outside /tmp, so this write would throw and crash the function
// on every cold start; local disk storage isn't used in production anyway
// now that uploads are stored in MongoDB, see services/upload.service.ts)
const uploadsDir = path.join(__dirname, '../uploads');
if (!process.env.VERCEL && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security HTTP Headers
// Note: crossOriginResourcePolicy must be relaxed to 'cross-origin', otherwise
// the browser blocks images served from /uploads when the frontend runs on a
// different port/origin (e.g. frontend on :3001, backend on :5000) -- this is
// what causes freshly-uploaded admin product images to appear broken.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// // CORS Configuration
// const allowedOrigins = [
//   env.CLIENT_URL,
//   'http://localhost:5173',
//   'http://127.0.0.1:5173',
//   'https://velora-frontend.vercel.app',
// ];

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
// }));

// CORS Configuration

// Vercel gives a frontend project multiple valid URLs: a short production
// alias (e.g. velora-frontend-chi.vercel.app) and a long per-deployment
// hash URL (e.g. velora-frontend-670nvza22-juhii07s-projects.vercel.app)
// that changes on every deploy. This pattern matches any *.vercel.app
// subdomain starting with "velora-frontend", covering both shapes.

const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://velora-jewellery.vercel.app',
  'https://velora-hlp031ynl-velora1526-5405s-projects.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Body parsers
// Images are now uploaded as base64 directly in the JSON body (stored in
// MongoDB -- see services/upload.service.ts), so this needs to comfortably
// fit a base64-encoded photo. MongoDB's own per-document limit is 16MB,
// so we stay safely under that.
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Serve static uploads
app.use('/uploads', express.static(uploadsDir));

// Sanitize data against NoSQL query injection
app.use(mongoSanitize());

// Custom xss / input sanitizer middleware
app.use(sanitizeRequest);

// Rate Limiter
app.use('/api', apiLimiter);

// Make sure MongoDB is actually connected before any /api route runs
// (see ensureDbConnected above for why this matters on Vercel).
app.use('/api', ensureDbConnected);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Velora Backend Server is healthy' });
});

// Mounting Router
app.use('/api', router);

// Global Error Handler Middleware
app.use(errorHandler);

// // Start Server
// const server = app.listen(env.PORT, () => {
//   console.log(`Velora Backend running in ${env.NODE_ENV} mode on port ${env.PORT}`);
// });

// Start Server (skipped on Vercel -- its serverless runtime imports
// the exported `app` directly and handles the HTTP listening itself)
let server: import('http').Server | undefined;
if (!process.env.VERCEL) {
  server = app.listen(env.PORT, () => {
    console.log(`Velora Backend running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
}

export { app, server };
export default app;
