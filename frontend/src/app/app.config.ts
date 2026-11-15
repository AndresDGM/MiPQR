import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { provideMipqrAdapter } from './core/application/providers/mipqr.adapter';
import { authInterceptor, errorInterceptor } from './core/infrastructure/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),

    // Inversión de dependencias: el adapter enlaza cada contrato del dominio
    // (AuthRepository, UserRepository, ...) con su implementación local o Node,
    // según environment.adapter.
    provideMipqrAdapter(environment.adapter),
  ],
};
