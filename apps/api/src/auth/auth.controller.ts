import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    // Strict: max 5 login attempts per minute per IP (prevent brute-force)
    @Throttle({ short: { ttl: 60_000, limit: 5 } })
    @Post('line/login')
    async lineLogin(@Body() body: { idToken: string; clientId: string; userProfile: any }) {
        console.log('Received LINE Login Request:', JSON.stringify(body.userProfile));
        return this.authService.validateLineLogin(body.userProfile);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getProfile(@Request() req: any) {
        return req.user;
    }
}
