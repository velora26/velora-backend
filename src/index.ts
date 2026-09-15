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

/* Database connection middleware */
const ensureDbConnected = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Database connection failed. Please try again in a moment.',
    });
  }
};

/* Uploads directory */
const uploadsDir = path.join(__dirname, '../uploads');

if (!process.env.VERCEL && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/* Security headers */
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);

/* CORS */
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://velora-jewellery.vercel.app',
];

const vercelProjectPattern =
  /^https:\/\/velora-[a-z0-9-]+\.vercel\.app$/;

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        vercelProjectPattern.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

/* Body parsers */
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

/* Static uploads */
app.use('/uploads', express.static(uploadsDir));

/* Security middleware */
app.use(mongoSanitize());
app.use(sanitizeRequest);
app.use('/api', apiLimiter);

/* Database check before API routes */
app.use('/api', ensureDbConnected);

/* Health check */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Velora Backend Server is healthy',
  });
});

/* API routes */
app.use('/api', router);

/* Error handler */
app.use(errorHandler);

/* Local server only */
let server: import('http').Server | undefined;

if (!process.env.VERCEL) {
  server = app.listen(env.PORT, () => {
    console.log(
      `Velora Backend running in ${env.NODE_ENV} mode on port ${env.PORT}`
    );
  });
}

export { app, server };
export default app;
