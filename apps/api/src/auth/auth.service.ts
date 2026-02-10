import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async validateLineLogin(lineProfile: {
        userId: string;
        displayName: string;
        pictureUrl?: string;
    }) {
        let user = await this.usersService.findByLineId(lineProfile.userId);

        if (!user) {
            user = await this.usersService.create({
                lineId: lineProfile.userId,
                displayName: lineProfile.displayName,
                pictureUrl: lineProfile.pictureUrl,
            });
        }

        const payload = { sub: user._id, lineId: user.lineId, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }

    async verifyLineToken(idToken: string, clientId: string) {
        // In production, use axios to call LINE API https://api.line.me/oauth2/v2.1/verify
        // For local dev/mock, we assume the token is valid or skip complex validation if just testing logic
        // Implementation of actual verify call:
        const params = new URLSearchParams();
        params.append('id_token', idToken);
        params.append('client_id', clientId);

        const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        if (!response.ok) {
            throw new UnauthorizedException('Invalid LINE token');
        }

        return await response.json();
    }
}
