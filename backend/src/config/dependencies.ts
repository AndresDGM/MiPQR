import { AuthenticateUseCase } from '../application/usecases/auth/authenticate.usecase.js';
import { envs } from './envs.js';
import { LoginUseCase } from '../application/usecases/auth/login.usecase.js';
import { RegisterUseCase } from '../application/usecases/auth/register.usecase.js';
import { GetAllRolesUseCase } from '../application/usecases/roles/get-all-roles.usecase.js';
import { GetRolByIdUseCase } from '../application/usecases/roles/get-rol-by-id.usecase.js';
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
} from '../application/usecases/pqrs/pqr.usecases.js';
import { DesCipherAdapter } from '../infrastructure/services/des-cipher.adapter.js';
import { RsaCipherAdapter } from '../infrastructure/services/rsa-cipher.adapter.js';
import { RolDatasource } from '../infrastructure/datasources/rol.datasource.js';
import { UsuarioDatasource } from '../infrastructure/datasources/usuario.datasource.js';
import { DocumentoAdjuntoDatasource } from '../infrastructure/datasources/documento-adjunto.datasource.js';
import { PqrDatasource } from '../infrastructure/datasources/pqr.datasource.js';
import { JwtTokenService } from '../infrastructure/services/jwt-token.service.js';
import { FileValidatorService } from '../infrastructure/services/file-validator.service.js';
import { RolRepositoryImpl } from '../infrastructure/repositories/rol.repository.impl.js';
import { UsuarioRepositoryImpl } from '../infrastructure/repositories/usuario.repository.impl.js';
import { DocumentoAdjuntoRepositoryImpl } from '../infrastructure/repositories/documento-adjunto.repository.impl.js';
import { PqrRepositoryImpl } from '../infrastructure/repositories/pqr.repository.impl.js';
import { LocalFileStorageAdapter } from '../infrastructure/repositories/local-file-storage.adapter.js';
import { AuthController } from '../presentation/controllers/auth.controller.js';
import { RolesController } from '../presentation/controllers/roles.controller.js';
import { UsuariosController } from '../presentation/controllers/usuarios.controller.js';
import { DocumentosController } from '../presentation/controllers/documentos.controller.js';
import { PqrController } from '../presentation/controllers/pqr.controller.js';
import { authenticate, optionalAuthenticate } from '../presentation/middlewares/authenticate.middleware.js';
import { authorize } from '../presentation/middlewares/authorize.middleware.js';
import { decryptBody } from '../presentation/middlewares/decrypt-body.middleware.js';
import { createUploadMiddleware } from '../presentation/middlewares/upload.middleware.js';

// 1. Datasources
const rolDatasource = new RolDatasource();
const usuarioDatasource = new UsuarioDatasource();
const documentoAdjuntoDatasource = new DocumentoAdjuntoDatasource();
const pqrDatasource = new PqrDatasource();

// Servicios de infraestructura
const tokenService = new JwtTokenService();
const fileValidatorService = new FileValidatorService();

// Servicios
// DES para las peticiones (transporte) y RSA para las contrasenas guardadas (reposo)
const requestCipher = new DesCipherAdapter(envs.DES_KEY);
export const passwordCipher = new RsaCipherAdapter(envs.RSA_N, envs.RSA_E, envs.RSA_D);

// Almacenamiento desacoplado mediante FileStorageRepository
const fileStorageRepository = new LocalFileStorageAdapter(envs.STORAGE_PATH);

// 2. Repositorios
const rolRepository = new RolRepositoryImpl(rolDatasource);
const usuarioRepository = new UsuarioRepositoryImpl(usuarioDatasource);
const documentoAdjuntoRepository = new DocumentoAdjuntoRepositoryImpl(documentoAdjuntoDatasource);
const pqrRepository = new PqrRepositoryImpl(pqrDatasource);

// 3. Casos de uso
const getAllRolesUseCase = new GetAllRolesUseCase(rolRepository);
const getRolByIdUseCase = new GetRolByIdUseCase(rolRepository);

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
const createPqrBackendUseCase = new CreatePqrBackendUseCase(pqrRepository);

// 4. Controladores
export const rolesController = new RolesController(
  getAllRolesUseCase,
  getRolByIdUseCase
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
  createPqrBackendUseCase
);

// 5. Middlewares
export const appMiddlewares = {
  authenticate: authenticate(authenticateUseCase),
  optionalAuthenticate: optionalAuthenticate(authenticateUseCase),
  authorize,
  decryptFields: (...campos: string[]) => decryptBody(requestCipher, ...campos),
  upload: createUploadMiddleware(envs.MAX_FILE_SIZE_MB * 1024 * 1024, envs.MAX_FILES_PER_REQUEST),
};
