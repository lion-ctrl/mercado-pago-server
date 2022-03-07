import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { LocalAuthGuard } from './guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';

@Controller('/api/v0/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  login(@Req() req: Request, @Body() dto: LoginDto) {
    return this.authService.login(req.user);
  }
}
