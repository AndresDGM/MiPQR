import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { FileValidatorService } from '../src/infrastructure/services/file-validator.service.js';
import { LocalFileStorageAdapter } from '../src/infrastructure/repositories/local-file-storage.adapter.js';

describe('FileValidatorService', () => {
  const validator = new FileValidatorService();
  const maxIndividualBytes = 10 * 1024 * 1024; // 10 MB

  it('debe validar un archivo PDF con firma binaria correcta', () => {
    // Magic bytes de PDF: %PDF-
    const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    const result = validator.validateFile(
      {
        originalname: 'historia_clinica.pdf',
        mimetype: 'application/pdf',
        size: pdfBuffer.length,
        buffer: pdfBuffer,
      },
      maxIndividualBytes
    );

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.normalizedExtension, '.pdf');
    assert.strictEqual(result.detectedMime, 'application/pdf');
  });

  it('debe validar un archivo PNG con firma binaria correcta', () => {
    // Magic bytes de PNG: 89 50 4E 47 0D 0A 1A 0A
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const result = validator.validateFile(
      {
        originalname: 'evidencia_radiografia.png',
        mimetype: 'image/png',
        size: pngBuffer.length,
        buffer: pngBuffer,
      },
      maxIndividualBytes
    );

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.normalizedExtension, '.png');
    assert.strictEqual(result.detectedMime, 'image/png');
  });

  it('debe validar un archivo JPEG con firma binaria correcta', () => {
    // Magic bytes de JPEG: FF D8 FF
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const result = validator.validateFile(
      {
        originalname: 'foto_formula.jpg',
        mimetype: 'image/jpeg',
        size: jpegBuffer.length,
        buffer: jpegBuffer,
      },
      maxIndividualBytes
    );

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.normalizedExtension, '.jpg');
    assert.strictEqual(result.detectedMime, 'image/jpeg');
  });

  it('debe validar un archivo DOCX (ZIP/OpenXML) con firma binaria correcta', () => {
    // Magic bytes de DOCX (ZIP): 50 4B 03 04
    const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
    const result = validator.validateFile(
      {
        originalname: 'tutela.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: docxBuffer.length,
        buffer: docxBuffer,
      },
      maxIndividualBytes
    );

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.normalizedExtension, '.docx');
  });

  it('debe rechazar un archivo cuya extensión no coincide con su contenido real (MIME spoofing)', () => {
    // Archivo con extensión .pdf pero contenido de texto plano sin firma %PDF-
    const fakePdfBuffer = Buffer.from('Este no es un pdf, es un texto simple que intenta engañar');
    assert.throws(
      () => {
        validator.validateFile(
          {
            originalname: 'trampa.pdf',
            mimetype: 'application/pdf',
            size: fakePdfBuffer.length,
            buffer: fakePdfBuffer,
          },
          maxIndividualBytes
        );
      },
      {
        name: 'CustomError',
        message: /no coincide con su extensión/,
      }
    );
  });

  it('debe rechazar extensiones ejecutables o peligrosas expresamente', () => {
    const exeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00');
    assert.throws(
      () => {
        validator.validateFile(
          {
            originalname: 'virus.exe',
            mimetype: 'application/x-msdownload',
            size: exeBuffer.length,
            buffer: exeBuffer,
          },
          maxIndividualBytes
        );
      },
      {
        name: 'CustomError',
        message: /peligroso no permitido/,
      }
    );
  });

  it('debe rechazar archivos que excedan el límite individual', () => {
    const pdfBuffer = Buffer.from('%PDF-1.4');
    assert.throws(
      () => {
        validator.validateFile(
          {
            originalname: 'pesado.pdf',
            mimetype: 'application/pdf',
            size: 20 * 1024 * 1024,
            buffer: pdfBuffer,
          },
          10 * 1024 * 1024
        );
      },
      {
        name: 'CustomError',
        message: /supera el tamaño máximo/,
      }
    );
  });

  it('debe rechazar lotes que superen la cantidad máxima permitida', () => {
    const dummy = {
      originalname: 'doc.pdf',
      mimetype: 'application/pdf',
      size: 100,
      buffer: Buffer.from('%PDF-'),
    };
    assert.throws(
      () => {
        validator.validateBatch([dummy, dummy, dummy, dummy, dummy, dummy], 5, 25 * 1024 * 1024);
      },
      {
        name: 'CustomError',
        message: /límite máximo de 5 archivos/,
      }
    );
  });
});

describe('LocalFileStorageAdapter', () => {
  const testStorageDir = './uploads/test-attachments';
  const storage = new LocalFileStorageAdapter(testStorageDir);

  it('debe guardar un archivo binario y generar un identificador único', async () => {
    const content = Buffer.from('%PDF-1.5 prueba de guardado persistente');
    const stored = await storage.save(content, '.pdf');

    assert.ok(stored.nombreInterno.endsWith('.pdf'));
    assert.ok(stored.tamanoBytes === content.length);

    const exists = await storage.exists(stored.rutaArchivo);
    assert.strictEqual(exists, true);

    const absPath = storage.getAbsolutePath(stored.rutaArchivo);
    assert.ok(fs.existsSync(absPath));

    // Limpieza
    await storage.delete(stored.rutaArchivo);
    const existsAfter = await storage.exists(stored.rutaArchivo);
    assert.strictEqual(existsAfter, false);
  });

  it('debe neutralizar intentos de Directory Traversal al consultar rutas', () => {
    const maliciousPath = '../../../etc/passwd';
    const absPath = storage.getAbsolutePath(maliciousPath);
    // path.basename previene la navegación hacia carpetas superiores
    assert.ok(!absPath.includes('/etc/passwd'));
    assert.ok(absPath.endsWith('passwd'));
  });
});
