import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { CLIENT_SERVER_HOST } from '../config/constants';
import { JwtAuthGuard } from '../auth/guard';
import { MercadopagoService } from './mercadopago.service';

@Controller('/api/v0/payment')
export class MercadopagoController {
  constructor(
    private readonly mercadoPagoService: MercadopagoService,
    private readonly config: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('/create-preference')
  async createPreference(@Req() req: Request) {
    return await this.mercadoPagoService.createPreference({
      amount: req.body.amount,
      user: req.user,
    });
  }

  @Get('/success')
  async success(@Req() req: Request, @Res() res: Response) {
    await this.mercadoPagoService.depositBalance({
      status: req.query,
    });
    res.redirect(`${this.config.get<string>(CLIENT_SERVER_HOST)}/cartera`);
  }

  @Get('/failure')
  async failure(@Query() query: any, @Res() res: Response) {
    await this.mercadoPagoService.failureBalance(query);
    res.redirect(`${this.config.get<string>(CLIENT_SERVER_HOST)}/cartera`);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/refund')
  async refund(@Req() req: Request) {
    return await this.mercadoPagoService.refund({
      amount: req.body.amount,
      user: req.user,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Put('/buy')
  async buyProduct(@Req() req: Request) {
    return await this.mercadoPagoService.buyProduct({
      amount: req.body.amount,
      user: req.user,
    });
  }
}
