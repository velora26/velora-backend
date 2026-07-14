// import { Request, Response, NextFunction } from 'express';
// import rateLimit from 'express-rate-limit';

// // Standard rate limiter for API endpoints
// export const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 200, // Limit each IP to 200 requests per windowMs
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: {
//     success: false,
//     error: 'Too many requests from this IP, please try again after 15 minutes'
//   }
// });

// // Stricter rate limiter for auth (login/register)
// export const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 30, // Limit each IP to 30 requests for auth routes
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: {
//     success: false,
//     error: 'Too many login attempts, please try again after 15 minutes'
//   }
// });

// // Helper function to recursively sanitize input keys
// const sanitizeInput = (val: any): any => {
//   if (typeof val === 'string') {
//     // Strip HTML tag entities and script injections
//     return val
//       .replace(/<[^>]*>/g, '') // remove HTML tags
//       .replace(/\$/g, '﹩') // convert Mongoose dollar query operator to similar unicode sign to block injection
//       .trim();
//   }
//   if (Array.isArray(val)) {
//     return val.map(sanitizeInput);
//   }
//   if (typeof val === 'object' && val !== null) {
//     const clean: any = {};
//     for (const key in val) {
//       if (Object.prototype.hasOwnProperty.call(val, key)) {
//         // Prevent key injection
//         const cleanKey = key.replace(/\$/g, '');
//         clean[cleanKey] = sanitizeInput(val[key]);
//       }
//     }
//     return clean;
//   }
//   return val;
// };

// // Input sanitization middleware
// export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
//   if (req.body) {
//     req.body = sanitizeInput(req.body);
//   }
//   if (req.query) {
//     req.query = sanitizeInput(req.query);
//   }
//   if (req.params) {
//     req.params = sanitizeInput(req.params);
//   }
//   next();
// };


import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import env from '../config/env';

const isDev = env.NODE_ENV !== 'production';

// Standard rate limiter for API endpoints
// In development, React StrictMode double-invokes effects and Vite HMR
// re-fires requests on every save, so a low limit trips almost immediately.
// Keep it strict in production, generous in development.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 5000 : 200, // 200/15min in production, 5000/15min in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

// Stricter rate limiter for auth (login/register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 500 : 30, // 30/15min in production, 500/15min in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts, please try again after 15 minutes'
  }
});

// Helper function to recursively sanitize input keys
const sanitizeInput = (val: any): any => {
  if (typeof val === 'string') {
    // Strip HTML tag entities and script injections
    return val
      .replace(/<[^>]*>/g, '') // remove HTML tags
      .replace(/\$/g, '﹩') // convert Mongoose dollar query operator to similar unicode sign to block injection
      .trim();
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeInput);
  }
  if (typeof val === 'object' && val !== null) {
    const clean: any = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        // Prevent key injection
        const cleanKey = key.replace(/\$/g, '');
        clean[cleanKey] = sanitizeInput(val[key]);
      }
    }
    return clean;
  }
  return val;
};

// Input sanitization middleware
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  if (req.params) {
    req.params = sanitizeInput(req.params);
  }
  next();
};