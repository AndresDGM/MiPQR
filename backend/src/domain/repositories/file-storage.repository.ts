export interface StoredFileResult {
  nombreInterno: string;
  rutaArchivo: string;
  tamanoBytes: number;
}

/**
 * Contrato de abstracción para almacenamiento físico de archivos fuera de la base de datos.
 *
 * @architecture Clean Architecture
 * @layer Domain
 */
export abstract class FileStorageRepository {
  /**
   * Persiste el buffer binario en el medio de almacenamiento y retorna los metadatos generados.
   */
  abstract save(buffer: Buffer, extension: string): Promise<StoredFileResult>;

  /**
   * Obtiene la ruta absoluta o identificador seguro para lectura/streaming.
   */
  abstract getAbsolutePath(rutaArchivo: string): string;

  /**
   * Comprueba si el archivo físico existe en el almacenamiento.
   */
  abstract exists(rutaArchivo: string): Promise<boolean>;

  /**
   * Elimina un archivo físico del almacenamiento.
   */
  abstract delete(rutaArchivo: string): Promise<void>;
}
