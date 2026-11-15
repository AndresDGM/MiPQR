import { inject, Injectable } from '@angular/core';
import { fakerES as faker } from '@faker-js/faker';
import { delay, Observable, of, throwError } from 'rxjs';
import { PqrNotFoundError } from '../../../domain/errors';
import { PqrHistory } from '../../../domain/models/pqr-history.model';
import { PqrResponse } from '../../../domain/models/pqr-response.model';
import { CreatePqrPayload, Pqr, PqrStatusName, PqrType } from '../../../domain/models/pqr.model';
import { CategoryLocalDatasource } from './category-local.datasource';
import { UserLocalDatasource } from './user-local.datasource';

/**
 * Datasource local en memoria para la entidad PQR y su historial/respuestas.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable({
  providedIn: 'root',
})
export class PqrLocalDatasource {
  private categoryDatasource = inject(CategoryLocalDatasource);
  private userDatasource = inject(UserLocalDatasource);

  private pqrs: Pqr[] = [];
  private history: PqrHistory[] = [];
  private responses: PqrResponse[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    const categories = this.categoryDatasource.getCategoriesSync();
    const tipos: PqrType[] = ['Peticion', 'Queja', 'Reclamo', 'Sugerencia'];
    const estados: PqrStatusName[] = ['Recibida', 'En revision', 'Asignada', 'En gestion', 'Respondida', 'Cerrada'];

    const asuntosPorTipo: Record<PqrType, string[]> = {
      Peticion: [
        'Solicitud de copia de historia clínica completa',
        'Expedición de certificado de atención médica',
        'Reasignación de cita con especialista en ortopedia',
        'Aclaración sobre fórmula médica prescrita',
      ],
      Queja: [
        'Demora excesiva en sala de espera de urgencias',
        'Inconformidad por trato recibido en recepción',
        'Tiempo prolongado para asignación de cita médica',
        'Dificultad de comunicación vía telefónica con SIAU',
      ],
      Reclamo: [
        'Cobro indebido de copago en cita autorizada',
        'Falta de entrega de medicamento pendiente en farmacia',
        'Pérdida de orden médica en módulo de admisiones',
        'Error en el valor facturado por procedimiento menor',
      ],
      Sugerencia: [
        'Implementar recordatorios de cita por WhatsApp',
        'Habilitar dispensador de turnos digital en sala',
        'Extender el horario de atención en farmacia',
        'Mejorar la señalización en el área de rayos X',
      ],
    };

    for (let i = 1; i <= 12; i++) {
      const tipo = faker.helpers.arrayElement(tipos);
      const estado = faker.helpers.arrayElement(estados);
      const categoria = faker.helpers.arrayElement(categories);
      const solicitanteNombre = faker.person.fullName();
      const solicitanteEmail = faker.internet.email();
      const codigo = `PQR-2026-${String(100 + i).padStart(4, '0')}`;
      const asunto = faker.helpers.arrayElement(asuntosPorTipo[tipo]);
      const fechaRegistro = faker.date.recent({ days: 15 }).toISOString();

      const pqr: Pqr = {
        idPqr: i,
        codigoSeguimiento: codigo,
        idSolicitante: 10 + i,
        nombreSolicitante: solicitanteNombre,
        correoSolicitante: solicitanteEmail,
        idCategoria: categoria.idCategoria,
        categoria: categoria.nombre,
        idEstado: estados.indexOf(estado) + 1,
        estado: estado,
        idResponsable: estado !== 'Recibida' && estado !== 'En revision' ? 2 : undefined,
        nombreResponsable: estado !== 'Recibida' && estado !== 'En revision' ? 'Fernando Salazar' : undefined,
        tipoPqr: tipo,
        asunto: asunto,
        descripcion: `${asunto}. Solicitado por ${solicitanteNombre}. Se requiere atención oportuna.`,
        fechaRegistro: fechaRegistro,
        fechaCierre: estado === 'Cerrada' ? new Date().toISOString() : undefined,
      };

      this.pqrs.push(pqr);

      this.history.push({
        idHistorial: this.history.length + 1,
        idPqr: i,
        idUsuario: 1,
        nombreUsuario: solicitanteNombre,
        idEstado: 1,
        estado: 'Recibida',
        accion: 'Radicación inicial',
        observacion: 'Solicitud radicada con éxito en la plataforma MiPQR.',
        fecha: fechaRegistro,
      });

      if (estado !== 'Recibida') {
        this.history.push({
          idHistorial: this.history.length + 1,
          idPqr: i,
          idUsuario: 2,
          nombreUsuario: 'Carolina Gómez (SIAU)',
          idEstado: pqr.idEstado,
          estado: estado,
          accion: 'Actualización de estado',
          observacion: `El estado del caso avanzó a: ${estado}.`,
          fecha: new Date().toISOString(),
        });
      }

      if (estado === 'Respondida' || estado === 'Cerrada') {
        this.responses.push({
          idRespuesta: this.responses.length + 1,
          idPqr: i,
          idUsuario: 3,
          nombreUsuario: 'Fernando Salazar',
          contenido: `Estimado(a) ${solicitanteNombre}: Dando respuesta a su solicitud, le informamos que las acciones correctivas fueron implementadas.`,
          fechaRespuesta: new Date().toISOString(),
        });
      }
    }
  }

  getAll(limit?: number): Observable<Pqr[]> {
    const result = limit ? this.pqrs.slice(0, limit) : [...this.pqrs];
    return of(result).pipe(delay(350));
  }

  getById(idPqr: number): Observable<Pqr> {
    const item = this.pqrs.find((p) => p.idPqr === idPqr);
    if (!item) {
      return throwError(() => new PqrNotFoundError(idPqr));
    }
    return of({ ...item }).pipe(delay(250));
  }

  getByCodigo(codigo: string): Observable<Pqr> {
    const clean = codigo.trim().toUpperCase();
    const item = this.pqrs.find((p) => p.codigoSeguimiento.toUpperCase() === clean);
    if (!item) {
      return throwError(() => new PqrNotFoundError(codigo));
    }
    return of({ ...item }).pipe(delay(300));
  }

  create(payload: CreatePqrPayload): Observable<Pqr> {
    const categories = this.categoryDatasource.getCategoriesSync();
    const newId = this.pqrs.length + 1;
    const codigo = `PQR-2026-${String(newId).padStart(4, '0')}`;
    const categoria = categories.find((c) => c.idCategoria === payload.idCategoria);
    const fecha = new Date().toISOString();

    const nueva: Pqr = {
      idPqr: newId,
      codigoSeguimiento: codigo,
      idSolicitante: 100 + newId,
      nombreSolicitante: payload.nombreSolicitante,
      correoSolicitante: payload.correoSolicitante,
      idCategoria: payload.idCategoria,
      categoria: categoria?.nombre ?? 'General',
      idEstado: 1,
      estado: 'Recibida',
      tipoPqr: payload.tipoPqr,
      asunto: payload.asunto,
      descripcion: payload.descripcion,
      fechaRegistro: fecha,
    };

    this.pqrs.unshift(nueva);

    this.history.push({
      idHistorial: this.history.length + 1,
      idPqr: newId,
      idUsuario: 1,
      nombreUsuario: payload.nombreSolicitante,
      idEstado: 1,
      estado: 'Recibida',
      accion: 'Radicación inicial',
      observacion: 'Solicitud radicada por el usuario desde el formulario web.',
      fecha,
    });

    return of(nueva).pipe(delay(400));
  }

  updateEstado(idPqr: number, nuevoEstado: PqrStatusName, observacion?: string): Observable<Pqr> {
    const index = this.pqrs.findIndex((p) => p.idPqr === idPqr);
    if (index === -1) {
      return throwError(() => new PqrNotFoundError(idPqr));
    }

    const current = this.pqrs[index]!;
    const updated: Pqr = {
      ...current,
      estado: nuevoEstado,
      fechaCierre: nuevoEstado === 'Cerrada' ? new Date().toISOString() : current.fechaCierre,
    };
    this.pqrs[index] = updated;

    this.history.push({
      idHistorial: this.history.length + 1,
      idPqr,
      idUsuario: 2,
      nombreUsuario: 'Analista SIAU',
      idEstado: 2,
      estado: nuevoEstado,
      accion: `Cambio a estado ${nuevoEstado}`,
      observacion: observacion || `Transición a ${nuevoEstado}`,
      fecha: new Date().toISOString(),
    });

    return of(updated).pipe(delay(300));
  }

  assignResponsable(idPqr: number, idResponsable: number): Observable<Pqr> {
    const index = this.pqrs.findIndex((p) => p.idPqr === idPqr);
    if (index === -1) {
      return throwError(() => new PqrNotFoundError(idPqr));
    }

    const users = this.userDatasource.getUsersSync();
    const responsable = users.find((u) => u.idUsuario === idResponsable);
    const updated: Pqr = {
      ...this.pqrs[index]!,
      idResponsable,
      nombreResponsable: responsable?.nombre ?? 'Responsable Asignado',
      estado: 'Asignada',
    };
    this.pqrs[index] = updated;

    this.history.push({
      idHistorial: this.history.length + 1,
      idPqr,
      idUsuario: 2,
      nombreUsuario: 'Analista SIAU',
      idEstado: 3,
      estado: 'Asignada',
      accion: 'Asignación de responsable',
      observacion: `Caso asignado a: ${updated.nombreResponsable}`,
      fecha: new Date().toISOString(),
    });

    return of(updated).pipe(delay(300));
  }

  getHistorial(idPqr: number): Observable<PqrHistory[]> {
    const events = this.history.filter((h) => h.idPqr === idPqr);
    return of([...events]).pipe(delay(250));
  }

  responder(idPqr: number, contenido: string): Observable<PqrResponse> {
    const response: PqrResponse = {
      idRespuesta: this.responses.length + 1,
      idPqr,
      idUsuario: 3,
      nombreUsuario: 'Fernando Salazar',
      contenido,
      fechaRespuesta: new Date().toISOString(),
    };
    this.responses.push(response);

    this.updateEstado(idPqr, 'Respondida', 'Se emitió respuesta formal al caso.');
    return of(response).pipe(delay(350));
  }
}
