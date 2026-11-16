import {
  ClassificationResult,
  PQRClassificationRepository,
} from '../../../domain/repositories/pqr-classification.repository.js';
import { CustomError } from '../../../domain/errors/custom.error.js';

/**
 * Caso de uso para clasificar una PQR mediante el modelo de Inteligencia Artificial.
 *
 * @architecture Clean Architecture
 * @layer Application
 */
export class ClassifyPqrUseCase {
  constructor(private readonly classificationRepository: PQRClassificationRepository) {}

  async execute(texto: string, features?: number[]): Promise<ClassificationResult | null> {
    if (!texto && (!features || features.length === 0)) {
      throw CustomError.badRequest('Se requiere suministrar el texto o un vector de características para clasificar la PQR');
    }
    return this.classificationRepository.classify(texto, features);
  }
}
