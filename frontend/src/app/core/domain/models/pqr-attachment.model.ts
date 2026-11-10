/**
 * Representa un documento de soporte o archivo adjunto asociado a una PQR.
 *
 * @architecture Clean Architecture
 * @layer Domain
 */
export interface PqrAttachment {
  /** Identificador único del documento adjunto */
  idAdjunto: number;

  /** Identificador de la PQR a la que pertenece */
  idPqr: number;

  /** Nombre original del archivo proporcionado por el usuario */
  nombreOriginal: string;

  /** Identificador o nombre interno único en el almacenamiento */
  nombreInterno: string;

  /** Extensión normalizada (ej: .pdf, .docx, .png, .jpg) */
  extension: string;

  /** Tipo MIME oficial detectado (ej: application/pdf) */
  mimeType: string;

  /** Tamaño en bytes del archivo */
  tamanoBytes: number;

  /** Fecha y hora de carga en formato ISO */
  fechaCarga: string;

  /** Identificador del usuario que realizó la carga (si aplica) */
  idUsuario?: number | null;

  /** Nombre del usuario que cargó el archivo (para visualización) */
  nombreUsuario?: string | null;

  /** URL temporal o remota para previsualización directa (si está disponible) */
  urlDescarga?: string;
}

/**
 * Tipos de archivo admitidos y clasificados para la interfaz de usuario.
 */
export type AttachmentCategory = 'pdf' | 'word' | 'image' | 'other';

/**
 * Determina la categoría visual de un adjunto según su extensión o MIME type.
 */
export function getAttachmentCategory(extension: string): AttachmentCategory {
  const ext = extension.toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.doc' || ext === '.docx') return 'word';
  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') return 'image';
  return 'other';
}

/**
 * Da formato legible en KB o MB a un tamaño en bytes.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
