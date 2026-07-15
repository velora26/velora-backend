import { Image } from '../models/image.model';

export class UploadService {
  async uploadImage(fileBuffer: Buffer, fileName: string, contentType: string): Promise<string> {
    const image = await Image.create({
      filename: fileName,
      contentType,
      data: fileBuffer
    });
    return image._id.toString();
  }

  async deleteImage(imageId: string): Promise<void> {
    await Image.findByIdAndDelete(imageId);
  }
}

export const uploadService = new UploadService();
export default uploadService;