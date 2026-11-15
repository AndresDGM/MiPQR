import { EnvironmentProviders, makeEnvironmentProviders, Provider, Type } from '@angular/core';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { CipherService } from '../../domain/services/cipher.service';
import { CategoryRepository } from '../../domain/repositories/category.repository';
import { PqrRepository } from '../../domain/repositories/pqr.repository';
import { PqrAttachmentRepository } from '../../domain/repositories/pqr-attachment.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { DesCipherAdapter } from '../../infrastructure/services/des-cipher.adapter';
import { AuthLocalRepositoryImpl } from '../../infrastructure/repositories/local-implementation/auth-local.repository.impl';
import { CategoryLocalRepositoryImpl } from '../../infrastructure/repositories/local-implementation/category-local.repository.impl';
import { PqrLocalRepositoryImpl } from '../../infrastructure/repositories/local-implementation/pqr-local.repository.impl';
import { PqrAttachmentLocalRepositoryImpl } from '../../infrastructure/repositories/local-implementation/pqr-attachment-local.repository.impl';
import { UserLocalRepositoryImpl } from '../../infrastructure/repositories/local-implementation/user-local.repository.impl';
import { AuthNodeRepositoryImpl } from '../../infrastructure/repositories/node-implementation/auth-node.repository.impl';
import { CategoryNodeRepositoryImpl } from '../../infrastructure/repositories/node-implementation/category-node.repository.impl';
import { PqrNodeRepositoryImpl } from '../../infrastructure/repositories/node-implementation/pqr-node.repository.impl';
import { PqrAttachmentNodeRepositoryImpl } from '../../infrastructure/repositories/node-implementation/pqr-attachment-node.repository.impl';
import { UserNodeRepositoryImpl } from '../../infrastructure/repositories/node-implementation/user-node.repository.impl';
import { ALL_USE_CASES } from './pqr.providers';

/**
 * Origen de datos de un módulo: simulación en memoria o Backend Node.js.
 */
export type AdapterSource = 'local' | 'node';

/**
 * Origen de datos por módulo del dominio.
 *
 * Permite combinar fuentes, por ejemplo usuarios y autenticación contra el
 * backend mientras las PQR y categorías siguen simuladas.
 */
export interface MipqrAdapterConfig {
  auth: AdapterSource;
  users: AdapterSource;
  pqrs: AdapterSource;
  categories: AdapterSource;
  attachments?: AdapterSource;
}

/**
 * Implementaciones disponibles por contrato de repositorio (interfaz del dominio).
 */
interface RepositoryBinding {
  contract: abstract new (...args: never[]) => unknown;
  local: Type<unknown>;
  node: Type<unknown>;
}

const BINDINGS: Record<keyof Required<MipqrAdapterConfig>, RepositoryBinding> = {
  auth: { contract: AuthRepository, local: AuthLocalRepositoryImpl, node: AuthNodeRepositoryImpl },
  users: { contract: UserRepository, local: UserLocalRepositoryImpl, node: UserNodeRepositoryImpl },
  pqrs: { contract: PqrRepository, local: PqrLocalRepositoryImpl, node: PqrNodeRepositoryImpl },
  categories: {
    contract: CategoryRepository,
    local: CategoryLocalRepositoryImpl,
    node: CategoryNodeRepositoryImpl,
  },
  attachments: {
    contract: PqrAttachmentRepository,
    local: PqrAttachmentLocalRepositoryImpl,
    node: PqrAttachmentNodeRepositoryImpl,
  },
};

/**
 * Adapter de la aplicación MiPQR.
 *
 * @description
 * Único punto donde se decide qué implementación atiende cada contrato del
 * dominio. Los casos de uso y la presentación solo conocen las clases
 * abstractas ({@link AuthRepository}, {@link UserRepository}, ...); Angular
 * les inyecta la implementación elegida en {@link MipqrAdapterConfig}.
 *
 * @architecture Clean Architecture
 * @layer Application
 *
 * @example
 * ```ts
 * provideMipqrAdapter({ auth: 'node', users: 'node', pqrs: 'local', categories: 'local', attachments: 'local' })
 * ```
 */
export function provideMipqrAdapter(config: MipqrAdapterConfig): EnvironmentProviders {
  const effectiveConfig: Required<MipqrAdapterConfig> = {
    auth: config.auth,
    users: config.users,
    pqrs: config.pqrs,
    categories: config.categories,
    attachments: config.attachments ?? config.pqrs,
  };

  const repositories: Provider[] = (Object.keys(BINDINGS) as (keyof MipqrAdapterConfig)[]).map(
    (modulo) => ({
      provide: BINDINGS[modulo].contract,
      useClass: BINDINGS[modulo][effectiveConfig[modulo]],
    })
  );

  // Servicios: el contrato de cifrado se resuelve con el adapter DES
  const services: Provider[] = [{ provide: CipherService, useClass: DesCipherAdapter }];

  return makeEnvironmentProviders([...ALL_USE_CASES, ...services, ...repositories]);
}
