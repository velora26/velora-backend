import { v2 as cloudinary } from 'cloudinary';
import env from '../config/env';

// Configure Cloudinary conditionally
let isCloudinaryConfigured = false;
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
  });
  isCloudinaryConfigured = true;
}

export class UploadService {
  async uploadImage(fileBuffer: Buffer, fileName: string): Promise<string> {
    if (isCloudinaryConfigured) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'velora', public_id: fileName.split('.')[0] },
          (error, result) => {
            if (error) return reject(error);
            resolve(result?.secure_url || '');
          }
        );
        uploadStream.end(fileBuffer);
      });
    }

    // Simulation/Fallback mode: Return a random high-quality jewelry placeholder
    const fallbackUrls = [
      'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=800&auto=format&fit=crop', // Bracelet
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop', // Ring
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop', // Pendant
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop'  // Accessories
    ];
    const randomIndex = Math.floor(Math.random() * fallbackUrls.length);
    return fallbackUrls[randomIndex];
  }

  async deleteImage(publicId: string): Promise<void> {
    if (isCloudinaryConfigured) {
      await cloudinary.uploader.destroy(publicId);
    }
  }
}

export const uploadService = new UploadService();
export default uploadService;
