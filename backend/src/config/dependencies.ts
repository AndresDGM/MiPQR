import { AuthenticateUseCase } from '../application/usecases/auth/authenticate.usecase.js';
import { envs } from './envs.js';
import { LoginUseCase } from '../application/usecases/auth/login.usecase.js';
import { RegisterUseCase } from '../application/usecases/auth/register.usecase.js';
import { GetAllRolesUseCase } from '../application/usecases/roles/get-all-roles.usecase.js';
import { GetRolByIdUseCase } from '../application/usecases/roles/get-rol-by-id.usecase.js';
import { GetAllCategoriasUseCase } from '../application/usecases/categorias/get-all-categorias.usecase.js';
import { GetCategoriaByIdUseCase } from '../application/usecases/categorias/get-categoria-by-id.usecase.js';
import { CreateUsuarioUseCase } from '../application/usecases/usuarios/create-usuario.usecase.js';
import { GetAllUsuariosUseCase } from '../application/usecases/usuarios/get-all-usuarios.usecase.js';
import { GetUsuarioByIdUseCase } from '../application/usecases/usuarios/get-usuario-by-id.usecase.js';
import { GetUsuariosByRolUseCase } from '../application/usecases/usuarios/get-usuarios-by-rol.usecase.js';
import { SetUsuarioActivoUseCase } from '../application/usecases/usuarios/set-usuario-activo.usecase.js';
import { UpdateUsuarioUseCase } from '../application/usecases/usuarios/update-usuario.usecase.js';
import { AttachDocumentosUseCase } from '../application/usecases/adjuntos/attach-documentos.usecase.js';
import { GetDocumentosByPqrUseCase } from '../application/usecases/adjuntos/get-documentos-by-pqr.usecase.js';
import { GetDocumentoByIdUseCase } from '../application/usecases/adjuntos/get-documento-by-id.usecase.js';
import { DeleteDocumentoUseCase } from '../application/usecases/adjuntos/delete-documento.usecase.js';
import {
  CreatePqrBackendUseCase,
  GetAllPqrsBackendUseCase,
  GetPqrByCodigoBackendUseCase,
  GetPqrByIdBackendUseCase,
  UpdatePqrCategoriaUseCase,
} from '../application/usecases/pqrs/pqr.usecases.js';
import { ClassifyPqrUseCase } from '../application/usecases/pqrs/classify-pqr.usecase.js';
import { HttpPqrClassificationAdapter } from '../infrastructure/repositories/http-pqr-classification.adapter.js';
import { AssignPqrResponsableBackendUseCase } from '../application/usecases/pqrs/assign-responsable.usecase.js';
import { UpdatePqrEstadoUseCase } from '../application/usecases/pqrs/update-pqr-estado.usecase.js';
import { GetPqrHistorialUseCase } from '../application/usecases/pqrs/get-pqr-historial.usecase.js';
import { ResponderPqrUseCase } from '../application/usecases/pqrs/responder-pqr.usecase.js';
import { CheckSlaAlertsUseCase } from '../application/usecases/pqrs/check-sla-alerts.usecase.js';
import { DesCipherAdapter } from '../infrastructure/services/des-cipher.adapter.js';
import { RsaCipherAdapter } from '../infrastructure/services/rsa-cipher.adapter.js';
import { RolDatasource } from '../infrastructure/datasources/rol.datasource.js';
import { CategoriaDatasource } from '../infrastructure/datasources/categoria.datasource.js';
import { UsuarioDatasource } from '../infrastructure/datasources/usuario.datasource.js';
import { DocumentoAdjuntoDatasource } from '../infrastructure/datasources/documento-adjunto.datasource.js';
import { PqrDatasource } from '../infrastructure/datasources/pqr.datasource.js';
import { JwtTokenService } from '../infrastructure/services/jwt-token.service.js';
import { FileValidatorService } from '../infrastructure/services/file-validator.service.js';
import { NodemailerEmailService } from '../infrastructure/services/nodemailer-email.service.js';
import { MetaWhatsAppService } from '../infrastructure/services/meta-whatsapp.service.js';
import { RolRepositoryImpl } from '../infrastructure/repositories/rol.repository.impl.js';
import { CategoriaRepositoryImpl } from '../infrastructure/repositories/categoria.repository.impl.js';
import { UsuarioRepositoryImpl } from '../infrastructure/repositories/usuario.repository.impl.js';
import { DocumentoAdjuntoRepositoryImpl } from '../infrastructure/repositories/documento-adjunto.repository.impl.js';
import { PqrRepositoryImpl } from '../infrastructure/repositories/pqr.repository.impl.js';
import { LocalFileStorageAdapter } from '../infrastructure/repositories/local-file-storage.adapter.js';
import { AuthController } from '../presentation/controllers/auth.controller.js';
import { RolesController } from '../presentation/controllers/roles.controller.js';
import { UsuariosController } from '../presentation/controllers/usuarios.controller.js';
import { DocumentosController } from '../presentation/controllers/documentos.controller.js';
import { PqrController } from '../presentation/controllers/pqr.controller.js';
import { CategoriasController } from '../presentation/controllers/categorias.controller.js';
import { authenticate, optionalAuthenticate } from '../presentation/middlewares/authenticate.middleware.js';
import { authorize } from '../presentation/middlewares/authorize.middleware.js';
import { decryptBody } from '../presentation/middlewares/decrypt-body.middleware.js';
import { createUploadMiddleware } from '../presentation/middlewares/upload.middleware.js';

// 1. Datasources
const rolDatasource = new RolDatasource();
const categoriaDatasource = new CategoriaDatasource();
const usuarioDatasource = new UsuarioDatasource();
const documentoAdjuntoDatasource = new DocumentoAdjuntoDatasource();
const pqrDatasource = new PqrDatasource();

// Servicios de infraestructura
const tokenService = new JwtTokenService();
const fileValidatorService = new FileValidatorService();
export const emailService = new NodemailerEmailService({
  host: envs.SMTP_HOST,
  port: envs.SMTP_PORT,
  user: envs.SMTP_USER,
  pass: envs.SMTP_PASS,
  from: envs.SMTP_FROM,
  secure: envs.SMTP_SECURE,
});

export const whatsappService = new MetaWhatsAppService({
  accessToken: envs.WHATSAPP_TOKEN,
  phoneNumberId: envs.WHATSAPP_PHONE_NUMBER_ID,
  apiVersion: envs.WHATSAPP_API_VERSION,
  templateName: envs.WHATSAPP_TEMPLATE_NAME,
  templateLang: envs.WHATSAPP_TEMPLATE_LANG,
});

// Servicios
// DES para las peticiones (transporte) y RSA para las contrasenas guardadas (reposo)
const requestCipher = new DesCipherAdapter(envs.DES_KEY);
export const passwordCipher = new RsaCipherAdapter(envs.RSA_N, envs.RSA_E, envs.RSA_D);

// Almacenamiento desacoplado mediante FileStorageRepository
const fileStorageRepository = new LocalFileStorageAdapter(envs.STORAGE_PATH);

// 2. Repositorios
const rolRepository = new RolRepositoryImpl(rolDatasource);
const categoriaRepository = new CategoriaRepositoryImpl(categoriaDatasource);
const usuarioRepository = new UsuarioRepositoryImpl(usuarioDatasource);
const documentoAdjuntoRepository = new DocumentoAdjuntoRepositoryImpl(documentoAdjuntoDatasource);
const pqrRepository = new PqrRepositoryImpl(pqrDatasource);
export const pqrClassificationRepository = new HttpPqrClassificationAdapter(
  envs.AI_SERVICE_URL,
  envs.AI_SERVICE_TIMEOUT_MS
);

// 3. Casos de uso
const getAllRolesUseCase = new GetAllRolesUseCase(rolRepository);
const getRolByIdUseCase = new GetRolByIdUseCase(rolRepository);
const getAllCategoriasUseCase = new GetAllCategoriasUseCase(categoriaRepository);
const getCategoriaByIdUseCase = new GetCategoriaByIdUseCase(categoriaRepository);

const getAllUsuariosUseCase = new GetAllUsuariosUseCase(usuarioRepository, rolRepository);
const getUsuarioByIdUseCase = new GetUsuarioByIdUseCase(usuarioRepository, rolRepository);
const getUsuariosByRolUseCase = new GetUsuariosByRolUseCase(usuarioRepository, rolRepository);
const createUsuarioUseCase = new CreateUsuarioUseCase(usuarioRepository, rolRepository, passwordCipher);
const updateUsuarioUseCase = new UpdateUsuarioUseCase(usuarioRepository, rolRepository);
const setUsuarioActivoUseCase = new SetUsuarioActivoUseCase(usuarioRepository, rolRepository);

const loginUseCase = new LoginUseCase(usuarioRepository, rolRepository, tokenService, passwordCipher);
const registerUseCase = new RegisterUseCase(createUsuarioUseCase, tokenService);
const authenticateUseCase = new AuthenticateUseCase(tokenService, usuarioRepository, rolRepository);

// Casos de uso de adjuntos y soporte
const attachDocumentosUseCase = new AttachDocumentosUseCase(
  pqrRepository,
  documentoAdjuntoRepository,
  fileStorageRepository,
  fileValidatorService,
  {
    maxIndividualBytes: envs.MAX_FILE_SIZE_MB * 1024 * 1024,
    maxFilesCount: envs.MAX_FILES_PER_REQUEST,
    maxTotalBytes: envs.MAX_TOTAL_SIZE_MB * 1024 * 1024,
  }
);
const getDocumentosByPqrUseCase = new GetDocumentosByPqrUseCase(pqrRepository, documentoAdjuntoRepository);
const getDocumentoByIdUseCase = new GetDocumentoByIdUseCase(
  documentoAdjuntoRepository,
  pqrRepository,
  fileStorageRepository
);
const deleteDocumentoUseCase = new DeleteDocumentoUseCase(
  documentoAdjuntoRepository,
  pqrRepository,
  fileStorageRepository
);

// Casos de uso de PQR
const getAllPqrsBackendUseCase = new GetAllPqrsBackendUseCase(pqrRepository);
const getPqrByIdBackendUseCase = new GetPqrByIdBackendUseCase(pqrRepository);
const getPqrByCodigoBackendUseCase = new GetPqrByCodigoBackendUseCase(pqrRepository);
const createPqrBackendUseCase = new CreatePqrBackendUseCase(
  pqrRepository,
  pqrClassificationRepository,
  emailService,
  envs.APP_URL,
  whatsappService
);
const assignPqrResponsableBackendUseCase = new AssignPqrResponsableBackendUseCase(
  pqrRepository,
  usuarioRepository,
  emailService,
  envs.APP_URL,
  whatsappService
);
const updatePqrCategoriaUseCase = new UpdatePqrCategoriaUseCase(pqrRepository);
const classifyPqrUseCase = new ClassifyPqrUseCase(pqrClassificationRepository);
const updatePqrEstadoUseCase = new UpdatePqrEstadoUseCase(pqrRepository);
const getPqrHistorialUseCase = new GetPqrHistorialUseCase(pqrRepository);
const responderPqrUseCase = new ResponderPqrUseCase(
  pqrRepository,
  emailService,
  whatsappService,
  envs.APP_URL
);

export const checkSlaAlertsUseCase = new CheckSlaAlertsUseCase(
  pqrRepository,
  usuarioRepository,
  emailService,
  whatsappService,
  envs.APP_URL,
  envs.SLA_ALERT_HOURS_BEFORE
);

// 4. Controladores
export const rolesController = new RolesController(
  getAllRolesUseCase,
  getRolByIdUseCase
);

export const categoriasController = new CategoriasController(
  getAllCategoriasUseCase,
  getCategoriaByIdUseCase
);

export const usuariosController = new UsuariosController(
  getAllUsuariosUseCase,
  getUsuarioByIdUseCase,
  getUsuariosByRolUseCase,
  createUsuarioUseCase,
  updateUsuarioUseCase,
  setUsuarioActivoUseCase
);

export const authController = new AuthController(loginUseCase, registerUseCase, getUsuarioByIdUseCase);

export const documentosController = new DocumentosController(
  attachDocumentosUseCase,
  getDocumentosByPqrUseCase,
  getDocumentoByIdUseCase,
  deleteDocumentoUseCase
);

export const pqrController = new PqrController(
  getAllPqrsBackendUseCase,
  getPqrByIdBackendUseCase,
  getPqrByCodigoBackendUseCase,
  createPqrBackendUseCase,
  classifyPqrUseCase,
  updatePqrCategoriaUseCase,
  assignPqrResponsableBackendUseCase,
  updatePqrEstadoUseCase,
  getPqrHistorialUseCase,
  responderPqrUseCase
);

// 5. Middlewares
export const appMiddlewares = {
  authenticate: authenticate(authenticateUseCase),
  optionalAuthenticate: optionalAuthenticate(authenticateUseCase),
  authorize,
  decryptFields: (...campos: string[]) => decryptBody(requestCipher, ...campos),
  upload: createUploadMiddleware(envs.MAX_FILE_SIZE_MB * 1024 * 1024, envs.MAX_FILES_PER_REQUEST),
};
