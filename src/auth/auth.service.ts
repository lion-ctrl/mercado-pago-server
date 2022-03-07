import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync } from 'bcryptjs';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<any | null> {
    const user = await this.userService.findByEmail(email);
    if (user && compareSync(String(password), user?.password)) {
      return user;
    }
    return null;
  }

  login(user: any) {
    delete user.password;
    return {
      user,
      accessToken: this.jwtService.sign({ id: user.id }),
    };
  }
}
