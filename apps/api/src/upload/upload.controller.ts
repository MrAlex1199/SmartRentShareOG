import {
    Controller,
    Post,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    /**
     * POST /upload
     * Upload a single file (image) to Cloudinary.
     * Returns: { url, secure_url, public_id }
     */
    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file attached. Use form-data with key "file"');
        return this.uploadService.uploadFile(file);
    }
}
