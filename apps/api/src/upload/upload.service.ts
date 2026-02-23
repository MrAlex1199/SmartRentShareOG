import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
    constructor(private configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
        });
    }

    async uploadFile(
        file: Express.Multer.File,
        folder = 'smartrentshare',
    ): Promise<{ url: string; secure_url: string; public_id: string }> {
        if (!file) throw new BadRequestException('No file provided');

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder, resource_type: 'auto' },
                (error, result) => {
                    if (error || !result) return reject(error || new Error('Upload failed'));
                    resolve({
                        url: result.url,
                        secure_url: result.secure_url,
                        public_id: result.public_id,
                    });
                },
            );
            Readable.from(file.buffer).pipe(uploadStream);
        });
    }
}
