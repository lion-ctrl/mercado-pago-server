import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hashSync } from 'bcryptjs';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async findByEmail(email: string) {
    const queryValues = [email];
    const query = `SELECT ?? FROM user WHERE email = ?`;
    const user = await this.dbService.select<any[]>({
      query,
      queryValues,
    });

    return user[0];
  }

  async create(dto: CreateUserDto) {
    const userExist = await this.findByEmail(dto.email);
    if (userExist) {
      throw new BadRequestException('Usuario registrado con este correo');
    }

    const query = 'INSERT INTO user SET ?';
    dto.password = hashSync(dto.password, 10);
    const result = await this.dbService.insert({
      query,
      data: dto,
    });

    const user = await this.findOne(result.insertId);
    return {
      user,
      accessToken: this.jwtService.sign({ id: user.id }),
    };
  }

  async findOne(id: number) {
    const query = 'SELECT id, username, email from user WHERE id = ?';
    const user = await this.dbService.select({ query, queryValues: [id] });
    return user[0];
  }

  async checkWallet(user_id: number) {
    const query = 'SELECT point FROM balance WHERE user_id = ?';
    const balance = await this.dbService.select<any[]>({
      query,
      queryValues: [user_id],
    });

    if (!balance.length) return { balance: null };

    let points = 0;
    for (const point of balance) {
      points += point.point;
    }
    return { balance: points };
  }
}
