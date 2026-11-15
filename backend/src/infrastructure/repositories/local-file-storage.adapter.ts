import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { CustomError } from '../../domain/errors/custom.error.js';
import {
  FileStorageRepository,
  StoredFileResult,
} from '../../domain/repositories/file-storage.repository.js';

/**
 * Adaptador de almacenamiento en el sistema de archivos local.
 *
 * @description
 * Almacena los archivos en un directorio aislado fuera del alcance público del servidor web.
 * Genera nombres UUID aleatorios para evitar colisiones y neutralizar ataques de path traversal.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
export class LocalFileStorageAdapter extends FileStorageRepository {
  private readonly storageDir: string;

  constructor(storagePath: string) {
    super();
    this.storageDir = path.resolve(process.cwd(), storagePath);
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async save(buffer: Buffer, extension: string): Promise<StoredFileResult> {
    this.ensureDirectoryExists();

    const cleanExt = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
    const uniqueFilename = `${crypto.randomUUID()}${cleanExt}`;
    const destinationPath = path.join(this.storageDir, uniqueFilename);

    // Protección estricta contra Path Traversal
    const resolvedPath = path.resolve(destinationPath);
    if (!resolvedPath.startsWith(this.storageDir)) {
      throw CustomError.badRequest('Ruta de archivo no autorizada');
    }

    await fs.promises.writeFile(resolvedPath, buffer);

    return {
      nombreInterno: uniqueFilename,
      rutaArchivo: uniqueFilename, // Guardamos el nombre relativo al storageDir
      tamanoBytes: buffer.length,
    };
  }

  getAbsolutePath(rutaArchivo: string): string {
    const sanitized = path.basename(rutaArchivo);
    const resolved = path.resolve(this.storageDir, sanitized);
    if (!resolved.startsWith(this.storageDir)) {
      throw CustomError.badRequest('Intento de acceso a ruta no permitida');
    }
    return resolved;
  }

  async exists(rutaArchivo: string): Promise<boolean> {
    try {
      const fullPath = this.getAbsolutePath(rutaArchivo);
      await fs.promises.access(fullPath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  async delete(rutaArchivo: string): Promise<void> {
    try {
      const fullPath = this.getAbsolutePath(rutaArchivo);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (error) {
      console.error(`Error al eliminar archivo del almacenamiento: ${rutaArchivo}`, error);
    }
  }
}
