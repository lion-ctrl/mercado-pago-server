import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPool, Pool, MysqlError, OkPacket } from 'mysql';
import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
} from '../config/constants';

interface SelectParams {
  query: string;
  queryIdentifiers?: string[];
  queryValues?: (number | string)[];
  nestTables?: boolean;
}

interface InsertParams {
  query: string;
  data: any;
}

interface UpdateParams {
  query: string;
  data: any;
  queryValues?: (string | number)[];
}

interface DeleteParams {
  query: string;
  queryValues?: (string | number)[];
}

@Injectable()
export class DatabaseService {
  private readonly dbConnection: Pool;

  constructor(private readonly config: ConfigService) {
    this.dbConnection = createPool({
      host: this.config.get<string>(DB_HOST),
      user: this.config.get<string>(DB_USER),
      password: this.config.get<string>(DB_PASSWORD),
      database: this.config.get<string>(DB_NAME),
      port: parseInt(this.config.get<string>(DB_PORT), 10),
    });
  }

  select<T>({
    query,
    queryIdentifiers,
    queryValues,
    nestTables,
  }: SelectParams): Promise<T> {
    const values = [];
    if (queryIdentifiers) {
      values.push(queryIdentifiers);
    } else {
      query = query.replace('??', '*');
    }
    if (queryValues) {
      values.push(...queryValues);
    }
    return new Promise((resolve, reject) => {
      this.dbConnection.query(
        { sql: query, nestTables },
        values,
        (err: MysqlError, rows: T) => {
          if (err) reject(err.message);
          resolve(rows);
        },
      );
    });
  }

  insert({ query, data }: InsertParams): Promise<OkPacket> {
    return new Promise<OkPacket>((resolve, reject) => {
      this.dbConnection.query(
        query,
        [data],
        (err: MysqlError, result: OkPacket) => {
          if (err) reject(err.sqlMessage);
          resolve(result);
        },
      );
    });
  }

  update({ query, data, queryValues = [] }: UpdateParams) {
    const values = [];
    values.push(data);
    if (queryValues.length) {
      values.push(...queryValues);
    }
    return new Promise<OkPacket>((resolve, reject) => {
      this.dbConnection.query(
        query,
        values,
        (err: MysqlError, result: OkPacket) => {
          if (err) reject(err.message);
          resolve(result);
        },
      );
    });
  }

  delete({ query, queryValues = [] }: DeleteParams) {
    const values = [];
    if (queryValues.length) {
      values.push(...queryValues);
    }
    return new Promise<OkPacket>((resolve, reject) => {
      this.dbConnection.query(
        query,
        values,
        (err: MysqlError, result: OkPacket) => {
          if (err) reject(err.message);
          resolve(result);
        },
      );
    });
  }
}
