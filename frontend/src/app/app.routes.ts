import { Routes } from '@angular/router';
import { authGuard } from './core/application/auth';
import { BandejaSiauComponent } from './presentation/pages/bandeja-siau';
import { ConsultaPqrComponent } from './presentation/pages/consulta-pqr';
import { DetallePqrComponent } from './presentation/pages/detalle-pqr';
import { HomeComponent } from './presentation/pages/home';
import { LoginComponent } from './presentation/pages/login';
import { NotFoundComponent } from './presentation/pages/not-found';
import { RegistroPqrComponent } from './presentation/pages/registro-pqr';
import { RegistroSolicitanteComponent } from './presentation/pages/registro-solicitante';

export const routes: Routes = [
  // Ruta pública principal
  { path: '', component: HomeComponent, title: 'Inicio — MiPQR' },

  // Rutas de autenticación y registro
  { path: 'login', component: LoginComponent, title: 'Iniciar Sesión — MiPQR' },
  {
    path: 'registro-solicitante',
    component: RegistroSolicitanteComponent,
    title: 'Registro de Solicitante — MiPQR',
  },

  // Radicación y consulta de PQR
  { path: 'registro-pqr', component: RegistroPqrComponent, title: 'Radicar PQR — MiPQR' },
  { path: 'consulta', component: ConsultaPqrComponent, title: 'Consultar PQR — MiPQR' },

  // Gestión administrativa protegida por roles (SIAU / Responsables / Directivos)
  {
    path: 'bandeja',
    component: BandejaSiauComponent,
    title: 'Bandeja de Gestión — MiPQR',
    canActivate: [authGuard(['Analista SIAU', 'Responsable', 'Directivo'])],
  },
  {
    path: 'detalle/:id',
    component: DetallePqrComponent,
    title: 'Detalle de Solicitud — MiPQR',
    canActivate: [authGuard(['Analista SIAU', 'Responsable', 'Directivo'])],
  },

  // Ruta 404
  { path: '**', component: NotFoundComponent, title: 'Página No Encontrada — MiPQR' },
];
