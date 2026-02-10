import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('line/login')
    async lineLogin(@Body() body: { idToken: string; clientId: string; userProfile: any }) {
        console.log('Received LINE Login Request:', JSON.stringify(body.userProfile));
        // 1. Verify token (in production)
        // await this.authService.verifyLineToken(body.idToken, body.clientId);

        // 2. Validate user in DB and generate JWT
        return this.authService.validateLineLogin(body.userProfile);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getProfile(@Request() req: any) {
        return req.user;
    }
}
