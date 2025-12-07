import { AuthService } from './auth.service';
import { Body, Controller, Post } from '@nestjs/common';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthLoginResponse } from './response/auth-login.response';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    async login(@Body() request: AuthLoginDto): Promise<AuthLoginResponse> {
        return await this.authService.login(request);
    }
}
