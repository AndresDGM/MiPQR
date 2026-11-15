/**
 * ViewModels para las vistas de autenticación y registro.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
export interface VmLogin {
  loading: boolean;
  error: string | null;
}

export interface VmRegistroSolicitante {
  loading: boolean;
  error: string | null;
  success: boolean;
}
