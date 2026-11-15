import path from 'path';
import { CustomError } from '../../domain/errors/custom.error.js';

export interface FileValidationResult {
  valid: boolean;
  normalizedExtension: string;
  detectedMime: string;
}

export interface FileToValidate {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * Servicio de infraestructura para validación rigurosa de archivos y prevención de cargas maliciosas.
 *
 * @description
 * Realiza una inspección profunda mediante números mágicos (firmas binarias) para evitar
 * el falseamiento de extensiones (MIME spoofing) y ataques de tipo polyglot o scripts ejecutables.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
export class FileValidatorService {
  /**
   * Extensiones prohibidas expresamente para protección del servidor y clientes.
   */
  private static readonly FORBIDDEN_EXTENSIONS = new Set([
    '.exe', '.bat', '.cmd', '.sh', '.bash', '.ps1', '.vbs', '.js', '.mjs', '.cjs',
    '.ts', '.py', '.php', '.pl', '.cgi', '.jar', '.com', '.scr', '.msi', '.dll',
    '.pif', '.hta', '.html', '.htm', '.xhtml', '.svg', '.bin', '.elf',
  ]);

  /**
   * Firmas mágicas de formatos permitidos
   */
  private static readonly MAGIC_SIGNATURES: Record<
    string,
    { mimes: string[]; check: (buf: Buffer) => boolean }
  > = {
    // PDF: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
    '.pdf': {
      mimes: ['application/pdf'],
      check: (buf) =>
        buf.length >= 4 &&
        buf[0] === 0x25 &&
        buf[1] === 0x50 &&
        buf[2] === 0x44 &&
        buf[3] === 0x46,
    },
    // JPEG / JPG: FF D8 FF
    '.jpg': {
      mimes: ['image/jpeg', 'image/pjpeg'],
      check: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
    },
    '.jpeg': {
      mimes: ['image/jpeg', 'image/pjpeg'],
      check: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
    },
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    '.png': {
      mimes: ['image/png'],
      check: (buf) =>
        buf.length >= 8 &&
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47 &&
        buf[4] === 0x0d &&
        buf[5] === 0x0a &&
        buf[6] === 0x1a &&
        buf[7] === 0x0a,
    },
    // DOCX: ZIP archive header PK.. (50 4B 03 04)
    '.docx': {
      mimes: [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/x-zip-compressed',
      ],
      check: (buf) =>
        buf.length >= 4 &&
        buf[0] === 0x50 &&
        buf[1] === 0x4b &&
        buf[2] === 0x03 &&
        buf[3] === 0x04,
    },
    // DOC: Microsoft Compound File Binary (CFB) OLE (D0 CF 11 E0 A1 B1 1A E1)
    '.doc': {
      mimes: ['application/msword', 'application/x-msword', 'application/vnd.ms-word'],
      check: (buf) =>
        buf.length >= 8 &&
        buf[0] === 0xd0 &&
        buf[1] === 0xcf &&
        buf[2] === 0x11 &&
        buf[3] === 0xe0 &&
        buf[4] === 0xa1 &&
        buf[5] === 0xb1 &&
        buf[6] === 0x1a &&
        buf[7] === 0xe1,
    },
  };

  /**
   * Valida un archivo individual contra las políticas de seguridad.
   */
  validateFile(file: FileToValidate, maxIndividualBytes: number): FileValidationResult {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw CustomError.badRequest(`El archivo "${file?.originalname || 'desconocido'}" está vacío`);
    }

    // 1. Tamaño máximo individual
    if (file.size > maxIndividualBytes) {
      const maxMb = (maxIndividualBytes / (1024 * 1024)).toFixed(1);
      throw CustomError.badRequest(
        `El archivo "${file.originalname}" supera el tamaño máximo permitido de ${maxMb} MB`
      );
    }

    // 2. Extraer y sanear extensión
    const rawExt = path.extname(file.originalname).toLowerCase();
    if (!rawExt) {
      throw CustomError.badRequest(`El archivo "${file.originalname}" carece de extensión`);
    }

    // 3. Comprobar lista negra de ejecutables
    if (FileValidatorService.FORBIDDEN_EXTENSIONS.has(rawExt)) {
      throw CustomError.badRequest(
        `Tipo de archivo potencialmente peligroso no permitido: "${rawExt}"`
      );
    }

    // 4. Comprobar si está en los formatos autorizados
    const signatureConfig = FileValidatorService.MAGIC_SIGNATURES[rawExt];
    if (!signatureConfig) {
      throw CustomError.badRequest(
        `Formato no soportado "${rawExt}". Solo se admiten PDF, Word (.doc, .docx) e imágenes (.jpg, .jpeg, .png)`
      );
    }

    // 5. Validación de números mágicos (MIME real del contenido binario)
    const matchesMagic = signatureConfig.check(file.buffer);
    if (!matchesMagic) {
      throw CustomError.badRequest(
        `El contenido binario del archivo "${file.originalname}" no coincide con su extensión ${rawExt}. Se rechazó por motivos de seguridad.`
      );
    }

    // Retorna MIME oficial
    const canonicalMime = signatureConfig.mimes[0]!;

    return {
      valid: true,
      normalizedExtension: rawExt,
      detectedMime: canonicalMime,
    };
  }

  /**
   * Valida la cantidad y el tamaño acumulado del lote de archivos.
   */
  validateBatch(
    files: FileToValidate[],
    maxCount: number,
    maxTotalBytes: number
  ): void {
    if (!files || files.length === 0) {
      throw CustomError.badRequest('No se adjuntaron archivos para procesar');
    }

    if (files.length > maxCount) {
      throw CustomError.badRequest(
        `Se ha excedido el límite máximo de ${maxCount} archivos por solicitud (recibidos: ${files.length})`
      );
    }

    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    if (totalBytes > maxTotalBytes) {
      const maxTotalMb = (maxTotalBytes / (1024 * 1024)).toFixed(1);
      throw CustomError.badRequest(
        `El tamaño total de los archivos adjuntos supera el límite permitido de ${maxTotalMb} MB`
      );
    }
  }
}
