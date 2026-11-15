import cors from 'cors';
import express, { Router } from 'express';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.middleware.js';

interface ServerOptions {
  port: number;
  routes: Router;
}

export class Server {
  public readonly app = express();
  private readonly port: number;
  private readonly routes: Router;

  constructor(options: ServerOptions) {
    this.port = options.port;
    this.routes = options.routes;
    this.configure();
  }

  private configure(): void {
    this.app.use(cors());
    this.app.use(express.json());

    // Rutas principales
    this.app.use('/api', this.routes);

    // Ruta no encontrada
    this.app.use(notFoundHandler);

    // Manejo global de errores
    this.app.use(errorHandler);
  }

  start(): void {
    this.app.listen(this.port, () => {
      console.log(`Servidor corriendo en http://localhost:${this.port}`);
    });
  }
}
