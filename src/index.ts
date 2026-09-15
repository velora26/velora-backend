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
import {
  apiLimiter,
  sanitizeRequest,
} from './middlewares/security.middleware';
import errorHandler from './middlewares/error.middleware';

const app = express();

/**
 * Database connection middleware
 */
const ensureDbConnected = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);

    res.status(503).json({
      success: false,
      error: 'Database connection failed. Please try again in a moment.',
    });
  }
};

/**
 * Uploads directory
 *
 * Vercel filesystem is read-only except for /tmp.
 * Therefore, do not create the uploads directory on Vercel.
 */
const uploadsDir = path.join(__dirname, '../uploads');

if (!process.env.VERCEL && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Security headers
 */
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);

/**
 * CORS configuration
 */
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://velora-jewellery.vercel.app',
  'https://velora-hlp031ynl-velora1526-5405s-projects.vercel.app',
].filter(Boolean);

const vercelFrontendPattern =
  /^https:\/\/velora-[a-z0-9-]+\.vercel\.app$/;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      // Allow exact origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Velora Vercel frontend deployment URLs
      if (vercelFrontendPattern.test(origin)) {
        return callback(null, true);
      }

      console.error('Blocked by CORS:', origin);

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/**
 * Body parsers
 *
 * 15mb supports base64 image uploads in JSON requests.
 */
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

/**
 * Static uploads
 */
app.use('/uploads', express.static(uploadsDir));

/**
 * Security middleware
 */
app.use(mongoSanitize());
app.use(sanitizeRequest);

/**
 * Rate limiter
 */
app.use('/api', apiLimiter);

/**
 * Database connection before API routes
 */
app.use('/api', ensureDbConnected);

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Velora Backend Server is healthy',
  });
});

/**
 * API routes
 */
app.use('/api', router);

/**
 * Global error handler
 */
app.use(errorHandler);

/**
 * Local server
 *
 * Vercel directly uses the exported Express app,
 * so the server should not listen on Vercel.
 */
let server: import('http').Server | undefined;

if (!process.env.VERCEL) {
  server = app.listen(env.PORT, () => {
    console.log(
      `Velora Backend running in ${env.NODE_ENV} mode on port ${env.PORT}`
    );
  });
}

/**
 * Exports
 */
export { app, server };
export default app;
