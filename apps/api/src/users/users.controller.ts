import {
    Controller,
    Get,
    Post,
    Patch,
    UseGuards,
    Request,
    Body,
    Param,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Query,
    Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UploadService } from '../upload/upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly uploadService: UploadService,
    ) { }

    /** GET /users/me — โปรไฟล์ตัวเอง */
    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req: any) {
        return this.usersService.findById(req.user.userId);
    }

    /** GET /users/:id — โปรไฟล์สาธารณะ */
    @Get(':id')
    async getPublicProfile(@Param('id') id: string) {
        const user = await this.usersService.findById(id);
        if (!user) throw new BadRequestException('ไม่พบผู้ใช้');
        // Return only safe public fields
        return {
            _id: user._id,
            displayName: user.displayName,
            pictureUrl: user.pictureUrl,
            isVerified: user.isVerified,
            averageRating: user.averageRating,
            totalReviews: user.totalReviews,
            role: user.role,
            createdAt: (user as any).createdAt,
        };
    }

    // ─── Verification ───────────────────────────────────────────────

    /**
     * POST /users/me/verification
     * ผู้ใช้ส่งรูปบัตรประชาชน / บัตรนักศึกษา
     * form-data: file (image), docType: "national_id" | "student_id"
     */
    @Post('me/verification')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
    async submitVerification(
        @UploadedFile() file: Express.Multer.File,
        @Body('docType') docType: 'national_id' | 'student_id',
        @Request() req: any,
    ) {
        if (!file) throw new BadRequestException('กรุณาแนบรูปบัตร');
        if (!['national_id', 'student_id'].includes(docType)) {
            throw new BadRequestException('docType ต้องเป็น national_id หรือ student_id');
        }

        const uploaded = await this.uploadService.uploadFile(file, 'smartrentshare/verifications');
        return this.usersService.submitVerification(
            req.user.userId,
            uploaded.secure_url,
            uploaded.public_id,
            docType,
        );
    }

    // ─── Admin Endpoints ────────────────────────────────────────────

    /** GET /users/admin/verifications — รายการ pending (admin only) */
    @Get('admin/verifications')
    @UseGuards(JwtAuthGuard)
    async getPendingVerifications(@Request() req: any) {
        return this.usersService.getPendingVerifications();
    }

    /** PATCH /users/:id/verify — Admin อนุมัติ/ปฏิเสธ */
    @Patch(':id/verify')
    @UseGuards(JwtAuthGuard)
    async reviewVerification(
        @Param('id') targetUserId: string,
        @Body('action') action: 'approve' | 'reject',
        @Body('rejectionReason') rejectionReason: string,
        @Request() req: any,
    ) {
        if (!['approve', 'reject'].includes(action)) {
            throw new BadRequestException('action ต้องเป็น approve หรือ reject');
        }
        return this.usersService.reviewVerification(
            req.user.userId,
            targetUserId,
            action,
            rejectionReason,
        );
    }

    // ─── Admin: User Management ──────────────────────────────────────

    /** GET /users/admin/list — ดึงรายชื่อผู้ใช้ทั้งหมด (admin only) */
    @Get('admin/list')
    @UseGuards(JwtAuthGuard)
    async listAllUsers(
        @Request() req: any,
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.usersService.listAll({
            search,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }

    /** PATCH /users/:id/status — Admin แบน / ปลดแบน */
    @Patch(':id/status')
    @UseGuards(JwtAuthGuard)
    async setUserStatus(
        @Param('id') targetUserId: string,
        @Body('status') status: 'active' | 'banned',
        @Request() req: any,
    ) {
        if (!['active', 'banned'].includes(status)) {
            throw new BadRequestException('status ต้องเป็น active หรือ banned');
        }
        return this.usersService.setStatus(req.user.userId, targetUserId, status);
    }

    /** PATCH /users/:id/role — Admin เปลี่ยน role */
    @Patch(':id/role')
    @UseGuards(JwtAuthGuard)
    async setUserRole(
        @Param('id') targetUserId: string,
        @Body('role') role: 'student' | 'admin',
        @Request() req: any,
    ) {
        if (!['student', 'admin'].includes(role)) {
            throw new BadRequestException('role ต้องเป็น student หรือ admin');
        }
        return this.usersService.setRole(req.user.userId, targetUserId, role);
    }

    // ─── Address Management ──────────────────────────────────────────

    @Post('me/addresses')
    @UseGuards(JwtAuthGuard)
    async addSavedAddress(
        @Request() req: any,
        @Body('label') label: string,
        @Body('address') address: string,
        @Body('isDefault') isDefault?: boolean,
    ) {
        if (!label || !address) throw new BadRequestException('label และ address ห้ามว่าง');
        return this.usersService.addSavedAddress(req.user.userId, label, address, !!isDefault);
    }

    @Patch('me/addresses/:index')
    @UseGuards(JwtAuthGuard)
    async updateSavedAddress(
        @Request() req: any,
        @Param('index') index: string,
        @Body('label') label: string,
        @Body('address') address: string,
        @Body('isDefault') isDefault?: boolean,
    ) {
        if (!label || !address) throw new BadRequestException('label และ address ห้ามว่าง');
        return this.usersService.updateSavedAddress(req.user.userId, parseInt(index), label, address, !!isDefault);
    }

    @Delete('me/addresses/:index')
    @UseGuards(JwtAuthGuard)
    async deleteSavedAddress(
        @Request() req: any,
        @Param('index') index: string,
    ) {
        return this.usersService.deleteSavedAddress(req.user.userId, parseInt(index));
    }
}
