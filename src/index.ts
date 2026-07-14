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
connectDB();

// // Ensure uploads folder exists
// const uploadsDir = path.join(__dirname, '../uploads');
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// Ensure uploads folder exists (skipped on Vercel -- its filesystem is
// read-only outside /tmp, so this write would throw and crash the function
// on every cold start; local disk storage isn't used in production anyway
// now that uploads go through Cloudinary, see services/upload.service.ts)
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
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

// Vercel gives every deployment a unique subdomain (e.g.
// velora-frontend-<random>-juhii07s-projects.vercel.app), which changes
// on every deploy -- so an exact string match in allowedOrigins would
// break again on the next deploy. This regex allows any deployment
// belonging to this Vercel account/project instead of one fixed URL.
const vercelProjectPattern = /^https:\/\/velora-frontend(-[a-z0-9]+)?-juhii07s-projects\.vercel\.app$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || vercelProjectPattern.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static uploads
app.use('/uploads', express.static(uploadsDir));

// Sanitize data against NoSQL query injection
app.use(mongoSanitize());

// Custom xss / input sanitizer middleware
app.use(sanitizeRequest);

// Rate Limiter
app.use('/api', apiLimiter);

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