import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { apiRouter } from './http/router';
import { errorHandler } from './http/middlewares/error-handler';
import { notFound } from './http/middlewares/not-found';

export class Server {
  public app: Application;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
    this.handleErrors();
  }

  config(): void {
    this.app.set('port', env.port);
    this.app.use(helmet());
    this.app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
    this.app.use(cors({ origin: env.corsOrigin }));
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ limit: '1mb', extended: true }));
  }

  routes(): void {
    this.app.use('/api', apiRouter);
    this.app.use(notFound);
  }

  handleErrors(): void {
    this.app.use(errorHandler);
  }
}
