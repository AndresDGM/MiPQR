import { Observable } from 'rxjs';
import { User, UserRoleName } from '../models/user.model';

/**
 * Contrato del repositorio de usuarios.
 *
 * @description
 * Define las operaciones abstractas de acceso a datos para la entidad `User`
 * en la capa de dominio.
 *
 * @architecture Clean Architecture
 * @layer Domain
 *
 * @example
 * ```ts
 * private userRepository = inject(UserRepository);
 * ```
 *
 * @see {@link User}
 */
export abstract class UserRepository {

  /**
   * Obtiene la lista completa de usuarios registrados.
   *
   * @param countUsers Cantidad opcional de registros a obtener
   * @returns Observable que emite un arreglo de {@link User}
   */
  abstract getAll(countUsers?: number): Observable<User[]>;

  /**
   * Obtiene un usuario mediante su identificador único.
   *
   * @param idUsuario Identificador numérico del usuario
   * @returns Observable que emite el {@link User}
   */
  abstract getById(idUsuario: number): Observable<User>;

  /**
   * Obtiene los usuarios que pertenecen a un rol específico (ej: Responsables para asignación).
   *
   * @param rol Nombre del rol a filtrar
   * @returns Observable con los usuarios que cumplen el rol
   */
  abstract getByRol(rol: UserRoleName): Observable<User[]>;
}

