import { Provider } from '@angular/core';
import {
  AssignPqrResponsableUseCase,
  CreatePqrUseCase,
  CreateUserUseCase,
  GetAllCategoriesUseCase,
  GetAllPqrsUseCase,
  GetAllUsersUseCase,
  GetCategoryByIdUseCase,
  GetPqrByCodigoUseCase,
  GetPqrByIdUseCase,
  GetPqrHistorialUseCase,
  GetUserByIdUseCase,
  GetUsersByRolUseCase,
  ResponderPqrUseCase,
  SetUserActivoUseCase,
  UpdatePqrEstadoUseCase,
  UpdateUserUseCase,
  UploadPqrAttachmentsUseCase,
  GetPqrAttachmentsUseCase,
  DownloadPqrAttachmentUseCase,
  DeletePqrAttachmentUseCase,
  UpdatePqrCategoriaUseCase,
} from '../usecases';

/**
 * Listado de casos de uso del dominio PQR y Documentos de Soporte.
 */
export const PQR_USE_CASES: Provider[] = [
  GetAllPqrsUseCase,
  GetPqrByIdUseCase,
  GetPqrByCodigoUseCase,
  CreatePqrUseCase,
  UpdatePqrEstadoUseCase,
  AssignPqrResponsableUseCase,
  ResponderPqrUseCase,
  GetPqrHistorialUseCase,
  UploadPqrAttachmentsUseCase,
  GetPqrAttachmentsUseCase,
  DownloadPqrAttachmentUseCase,
  DeletePqrAttachmentUseCase,
  UpdatePqrCategoriaUseCase,
];

/**
 * Listado de casos de uso para las entidades User y Category.
 */
export const USER_CATEGORY_USE_CASES: Provider[] = [
  GetAllUsersUseCase,
  GetUserByIdUseCase,
  GetUsersByRolUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
  SetUserActivoUseCase,
  GetAllCategoriesUseCase,
  GetCategoryByIdUseCase,
];

/**
 * Casos de uso consolidados del dominio MiPQR.
 */
export const ALL_USE_CASES: Provider[] = [
  ...PQR_USE_CASES,
  ...USER_CATEGORY_USE_CASES,
];
