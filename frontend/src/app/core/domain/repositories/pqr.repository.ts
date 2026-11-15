import { Observable } from 'rxjs';
import { CreatePqrPayload, Pqr, PqrStatusName } from '../models/pqr.model';
import { PqrHistory } from '../models/pqr-history.model';
import { PqrResponse } from '../models/pqr-response.model';

/**
 * Contrato del repositorio de PQRs.
 *
 * @description
 * Define las operaciones abstractas de acceso a datos para la entidad `Pqr`
 * dentro de la **capa de dominio**, siguiendo los lineamientos de Clean Architecture.
 *
 * Establece el contrato que cualquier adaptador de infraestructura (HTTP REST,
 * mocks locales, GraphQL, etc.) debe implementar, manteniendo al dominio y a los
 * casos de uso aislados de los detalles técnicos.
 *
 * @architecture Clean Architecture
 * @layer Domain
 *
 * @example
 * ```ts
 * // Inyección por contrato en un caso de uso
 * private pqrRepository = inject(PqrRepository);
 * ```
 *
 * @see {@link Pqr}
 * @see {@link CreatePqrPayload}
 */
export abstract class PqrRepository {

  /**
   * Obtiene el listado completo de solicitudes PQR.
   *
   * @param limit Cantidad máxima de registros a recuperar (opcional)
   * @returns Observable que emite un arreglo de {@link Pqr}
   */
  abstract getAll(limit?: number): Observable<Pqr[]>;

  /**
   * Obtiene una PQR por su identificador primario.
   *
   * @param idPqr Identificador numérico de la PQR
   * @returns Observable que emite la entidad {@link Pqr} encontrada
   */
  abstract getById(idPqr: number): Observable<Pqr>;

  /**
   * Consulta una PQR mediante su código único de seguimiento.
   *
   * @param codigoSeguimiento Código radicado (ej: 'PQR-2026-001')
   * @returns Observable que emite la entidad {@link Pqr} asociada
   */
  abstract getByCodigoSeguimiento(codigoSeguimiento: string): Observable<Pqr>;

  /**
   * Registra una nueva PQR en el sistema.
   *
   * @param payload Datos necesarios para la radicación
   * @returns Observable que emite la {@link Pqr} creada
   */
  abstract create(payload: CreatePqrPayload): Observable<Pqr>;

  /**
   * Actualiza el estado del ciclo de vida de una PQR.
   *
   * @param idPqr Identificador de la PQR
   * @param nuevoEstado Nombre del nuevo estado
   * @param observacion Justificación o motivo del cambio
   * @returns Observable que emite la {@link Pqr} actualizada
   */
  abstract updateEstado(idPqr: number, nuevoEstado: PqrStatusName, observacion?: string): Observable<Pqr>;

  /**
   * Asigna un responsable a una PQR.
   *
   * @param idPqr Identificador de la PQR
   * @param idResponsable Identificador del usuario responsable
   * @returns Observable que emite la {@link Pqr} con el responsable asignado
   */
  abstract assignResponsable(idPqr: number, idResponsable: number): Observable<Pqr>;

  /**
   * Obtiene el historial de trazabilidad y eventos de una PQR.
   *
   * @param idPqr Identificador de la PQR
   * @returns Observable con los eventos de trazabilidad {@link PqrHistory}
   */
  abstract getHistorial(idPqr: number): Observable<PqrHistory[]>;

  /**
   * Registra la respuesta oficial de atención a una PQR.
   *
   * @param idPqr Identificador de la PQR
   * @param contenido Texto de la respuesta oficial
   * @returns Observable con la respuesta generada {@link PqrResponse}
   */
  abstract responder(idPqr: number, contenido: string): Observable<PqrResponse>;
}

