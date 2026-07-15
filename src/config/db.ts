// import mongoose from 'mongoose';
// import env from './env';

// export const connectDB = async (): Promise<void> => {
//   try {
//     const conn = await mongoose.connect(env.MONGODB_URI);
//     console.log(`MongoDB Connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.error(`Error connecting to MongoDB: ${error instanceof Error ? error.message : error}`);
//     process.exit(1);
//   }
// };

// export default connectDB;

import mongoose from 'mongoose';
import env from './env';

// Serverless-safe MongoDB connection.
//
// On a normal long-running server, connecting once at startup is fine. On
// Vercel, each cold start re-runs this module, and multiple concurrent
// invocations can each try to open their own connection -- without caching,
// this quickly exhausts MongoDB's connection limit and causes intermittent
// 500s under load. Caching the connection promise on `global` means warm
// invocations (the common case) reuse the existing connection instead of
// opening a new one.
//
// This also intentionally never calls process.exit() on failure. On a
// serverless platform, exiting the process kills the whole function
// instance mid-request, which can take down completely unrelated requests
// being handled by the same warm container. Instead, a connection failure
// here just rejects the returned promise, which the caller (see the
// ensureDbConnected middleware in index.ts) turns into a normal 500
// response for that one request.

declare global {
  // eslint-disable-next-line no-var
  var __veloraMongoosePromise: Promise<typeof mongoose> | undefined;
}

export const connectDB = (): Promise<typeof mongoose> => {
  if (!global.__veloraMongoosePromise) {
    global.__veloraMongoosePromise = mongoose
      .connect(env.MONGODB_URI, {
        // Fail fast instead of hanging if MongoDB is unreachable -- a long
        // hang here is what usually shows up as a generic Vercel timeout /
        // 504, or a request that dies without a clear error.
        serverSelectionTimeoutMS: 8000
      })
      .then((conn) => {
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
      })
      .catch((error) => {
        console.error(`Error connecting to MongoDB: ${error instanceof Error ? error.message : error}`);
        // Clear the cached promise so the *next* request gets a fresh
        // attempt instead of being permanently stuck on a failed one.
        global.__veloraMongoosePromise = undefined;
        throw error;
      });
  }
  return global.__veloraMongoosePromise;
};

export default connectDB;