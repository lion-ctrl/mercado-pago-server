import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mercadopago from 'mercadopago';
import { DatabaseService } from '../database/database.service';
import { MERCADO_PAGO_SECRET_KEY, SERVER_HOST } from '../config/constants';

@Injectable()
export class MercadopagoService {
  constructor(
    private readonly config: ConfigService,
    private readonly dbService: DatabaseService,
  ) {
    mercadopago.configure({
      access_token: this.config.get<string>(MERCADO_PAGO_SECRET_KEY),
    });
  }

  async createPreference({ user, amount }: { user: any; amount: number }) {
    const preference = await mercadopago.preferences.create({
      items: [
        {
          unit_price: amount,
          quantity: 1,
          title: 'Depositar saldo',
        },
      ],
      back_urls: {
        success: `${this.config.get<string>(
          SERVER_HOST,
        )}/api/v0/payment/success?user_id=${user.id}`,
        failure: `${this.config.get<string>(
          SERVER_HOST,
        )}/api/v0/payment/failure?user_id=${user.id}`,
      },
      auto_return: 'approved',
    });
    return preference;
  }

  async depositBalance({ status }: { status: any }) {
    if (status.status !== 'approved') return;

    try {
      let query = 'SELECT id FROM user WHERE id = ?';
      const user = await this.dbService.select<any[]>({
        query,
        queryValues: [status.user_id],
      });
      if (!user.length) return;

      query = 'SELECT id FROM balance WHERE payment_id = ?';
      const balance = await this.dbService.select<any[]>({
        query,
        queryValues: [status.payment_id],
      });
      if (balance.length) return;

      const payment = await mercadopago.payment.get(status.payment_id);
      if (payment.body.status !== 'approved') return;

      query = 'INSERT INTO balance SET ?';
      await this.dbService.insert({
        query,
        data: {
          user_id: status.user_id,
          point: payment.body.transaction_amount,
          payment_id: payment.body.id,
        },
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  async failureBalance(status: any) {
    console.log(status);
  }

  async refund({ amount, user }: { amount: number; user: any }) {
    const query = 'SELECT id, point, payment_id FROM balance WHERE user_id = ?';
    const balance = await this.dbService.select<any[]>({
      query,
      queryValues: [user.id],
    });

    let checkAmount = 0;
    for (const point of balance) {
      checkAmount += point.point;
    }

    if (checkAmount < amount) {
      throw new BadRequestException(
        'El monto a retirar es mayor que el que posee en su cuenta',
      );
    }

    const arr = balance.sort((a, b) => a.point - b.point);
    while (amount > 0) {
      const payment = arr.at(0);

      try {
        await mercadopago.refund.create({
          payment_id: payment.payment_id,
          amount: payment.point > amount ? amount : payment.point,
        });

        if (payment.point > amount) {
          const query = 'UPDATE balance SET ? WHERE user_id = ? AND id = ?';
          await this.dbService.update({
            query,
            data: {
              point: payment.point - amount,
            },
            queryValues: [user.id, payment.id],
          });
          amount = 0;
        } else {
          const query = 'DELETE FROM balance WHERE user_id = ? AND id = ?';
          await this.dbService.delete({
            query,
            queryValues: [user.id, payment.id],
          });
          amount -= payment.point;
          arr.shift();
        }
      } catch (error) {
        console.error(error);
        throw new InternalServerErrorException(error);
      }
    }
    return { message: 'Monto retirado satisfactoriamente' };
  }

  async buyProduct({ amount, user }: { amount: number; user: any }) {
    const query = 'SELECT id, point, payment_id FROM balance WHERE user_id = ?';
    const balance = await this.dbService.select<any[]>({
      query,
      queryValues: [user.id],
    });

    let checkAmount = 0;
    for (const point of balance) {
      checkAmount += point.point;
    }

    if (checkAmount < amount) {
      throw new BadRequestException('Saldo insuficiente');
    }

    const arr = balance.sort((a, b) => a.point - b.point);
    while (amount > 0) {
      const payment = arr.at(0);

      if (payment.point > amount) {
        const query = 'UPDATE balance SET ? WHERE user_id = ? AND id = ?';
        await this.dbService.update({
          query,
          data: {
            point: payment.point - amount,
          },
          queryValues: [user.id, payment.id],
        });
        amount = 0;
      } else {
        const query = 'DELETE FROM balance WHERE user_id = ? AND id = ?';
        await this.dbService.delete({
          query,
          queryValues: [user.id, payment.id],
        });
        amount -= payment.point;
        arr.shift();
      }
    }
    return { message: 'Compra realizada satisfactoriamente' };
  }
}
