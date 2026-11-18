export interface ClassificationResult {
  categoriaPredicha: string;
  indiceClase: number;
  confianza: number;
  claseModeloOriginal: string;
  versionModelo: string;
  metodoInferencia: string;
}

/**
 * Contrato de repositorio / servicio de clasificación automática de PQRs mediante IA.
 *
 * @architecture Clean Architecture
 * @layer Domain
 */
export abstract class PQRClassificationRepository {
  /**
   * Solicita la clasificación de una PQR a partir de su contenido o características.
   * Retorna null si el servicio de IA no está disponible o la petición excede el tiempo límite.
   */
  abstract classify(texto: string, features?: number[]): Promise<ClassificationResult | null>;
}
