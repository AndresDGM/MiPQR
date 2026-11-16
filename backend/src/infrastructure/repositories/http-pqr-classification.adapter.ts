import {
  ClassificationResult,
  PQRClassificationRepository,
} from '../../domain/repositories/pqr-classification.repository.js';

interface FastApiPredictResponse {
  categoria_predicha: string;
  indice_clase: number;
  confianza: number;
  clase_modelo_original: string;
  probabilidades: number[];
  version_modelo: string;
  metodo_inferencia: string;
}

/**
 * Adaptador de infraestructura HTTP para comunicación con el microservicio de IA (FastAPI).
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
export class HttpPqrClassificationAdapter extends PQRClassificationRepository {
  constructor(
    private readonly baseUrl: string = 'http://localhost:8000',
    private readonly timeoutMs: number = 5000
  ) {
    super();
  }

  async classify(texto: string, features?: number[]): Promise<ClassificationResult | null> {
    const cleanUrl = this.baseUrl.replace(/\/$/, '');
    const endpoint = `${cleanUrl}/predict`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          texto: texto || undefined,
          features: features || undefined,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        console.warn(
          `[HttpPqrClassificationAdapter] Microservicio de IA respondió con estado HTTP ${response.status}`
        );
        return null;
      }

      const data = (await response.json()) as FastApiPredictResponse;

      return {
        categoriaPredicha: data.categoria_predicha,
        indiceClase: data.indice_clase,
        confianza: data.confianza,
        claseModeloOriginal: data.clase_modelo_original,
        versionModelo: data.version_modelo,
        metodoInferencia: data.metodo_inferencia,
      };
    } catch (error: any) {
      if (error?.name === 'TimeoutError') {
        console.warn(`[HttpPqrClassificationAdapter] Tiempo de espera agotado (${this.timeoutMs}ms) comunicando con IA.`);
      } else {
        console.warn(`[HttpPqrClassificationAdapter] Microservicio de IA no disponible:`, error?.message);
      }
      return null;
    }
  }
}
