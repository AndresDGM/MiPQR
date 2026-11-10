import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { PqrAttachment } from '../../../domain/models/pqr-attachment.model';

/**
 * Datasource local simulado en memoria para documentos adjuntos.
 *
 * @description
 * Permite probar de extremo a extremo la experiencia de usuario de selección,
 * vista previa, descarga y eliminación de documentos incluso cuando el frontend
 * se ejecuta con el adapter en modo local (in-memory).
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable({
  providedIn: 'root',
})
export class PqrAttachmentLocalDatasource {
  private attachments: PqrAttachment[] = [];
  private blobStore: Map<number, Blob> = new Map();
  private nextId = 1;

  constructor() {
    this.seedInitialAttachments();
  }

  private seedInitialAttachments(): void {
    // Generar muestras simuladas para las PQR iniciales
    const mockPdfContent = '%PDF-1.4\n% Muestra simulada para pruebas de MiPQR\n%%EOF';
    const mockPdfBlob = new Blob([mockPdfContent], { type: 'application/pdf' });

    const seeds: {
      idPqr: number;
      nombre: string;
      ext: string;
      mime: string;
      tamano: number;
      usuario?: string;
    }[] = [
      {
        idPqr: 1,
        nombre: 'Accion_de_tutela_salud.pdf',
        ext: '.pdf',
        mime: 'application/pdf',
        tamano: 184520,
        usuario: 'Carlos Restrepo',
      },
      {
        idPqr: 1,
        nombre: 'Historia_clinica_resumen.pdf',
        ext: '.pdf',
        mime: 'application/pdf',
        tamano: 452010,
        usuario: 'Carlos Restrepo',
      },
      {
        idPqr: 2,
        nombre: 'Factura_copago_consulta.pdf',
        ext: '.pdf',
        mime: 'application/pdf',
        tamano: 92400,
        usuario: 'Carlos Restrepo',
      },
      {
        idPqr: 3,
        nombre: 'Formula_medica_receta.png',
        ext: '.png',
        mime: 'image/png',
        tamano: 340150,
        usuario: 'Mariana Gómez',
      },
    ];

    for (const seed of seeds) {
      const id = this.nextId++;
      const internal = `mock-${id}${seed.ext}`;
      const attachment: PqrAttachment = {
        idAdjunto: id,
        idPqr: seed.idPqr,
        nombreOriginal: seed.nombre,
        nombreInterno: internal,
        extension: seed.ext,
        mimeType: seed.mime,
        tamanoBytes: seed.tamano,
        fechaCarga: new Date(Date.now() - 86400000 * 2).toISOString(),
        idUsuario: 1,
        nombreUsuario: seed.usuario,
      };

      this.attachments.push(attachment);
      this.blobStore.set(id, mockPdfBlob);
    }
  }

  upload(idPqr: number, files: File[]): Observable<PqrAttachment[]> {
    const uploaded: PqrAttachment[] = [];

    for (const file of files) {
      const id = this.nextId++;
      const ext = '.' + file.name.split('.').pop()!.toLowerCase();
      const internal = `sim-${id}-${file.name}`;

      const attachment: PqrAttachment = {
        idAdjunto: id,
        idPqr,
        nombreOriginal: file.name,
        nombreInterno: internal,
        extension: ext,
        mimeType: file.type || 'application/octet-stream',
        tamanoBytes: file.size,
        fechaCarga: new Date().toISOString(),
        idUsuario: null,
        nombreUsuario: 'Solicitante Web',
      };

      this.attachments.push(attachment);
      this.blobStore.set(id, file);
      uploaded.push(attachment);
    }

    return of(uploaded).pipe(delay(400));
  }

  getByPqrId(idPqr: number): Observable<PqrAttachment[]> {
    const items = this.attachments.filter((a) => a.idPqr === idPqr);
    return of([...items]).pipe(delay(250));
  }

  getDownloadBlob(idAdjunto: number): Observable<Blob> {
    const blob = this.blobStore.get(idAdjunto);
    if (!blob) {
      // Si es un seed simulado sin blob específico, creamos un placeholder
      const item = this.attachments.find((a) => a.idAdjunto === idAdjunto);
      if (item) {
        const dummyBlob = new Blob([`Contenido simulado del archivo ${item.nombreOriginal}`], {
          type: item.mimeType,
        });
        return of(dummyBlob).pipe(delay(200));
      }
      return throwError(() => new Error('Documento no encontrado'));
    }
    return of(blob).pipe(delay(200));
  }

  delete(idAdjunto: number): Observable<boolean> {
    const index = this.attachments.findIndex((a) => a.idAdjunto === idAdjunto);
    if (index === -1) {
      return of(false);
    }
    this.attachments.splice(index, 1);
    this.blobStore.delete(idAdjunto);
    return of(true).pipe(delay(200));
  }
}
