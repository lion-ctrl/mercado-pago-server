import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto';
import { JwtAuthGuard } from '../auth/guard';

@Controller('/api/v0/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return await this.userService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/wallet')
  async checkWallet(@Req() req: any) {
    return await this.userService.checkWallet(req.user.id);
  }
}
